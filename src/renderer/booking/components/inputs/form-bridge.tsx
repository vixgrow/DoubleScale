import React from 'react';
import { Form as ShadcnForm } from '@doublescale/shared/ui/form';
import {
	Controller,
	useForm,
	useFormContext,
	useWatch,
} from 'react-hook-form';

export type FieldRule = {
	required?: boolean;
	type?: string;
	pattern?: RegExp;
	min?: number;
	max?: number;
	message?: string;
};

type FormValues = Record<string, unknown>;

export type FormInstance = {
	getFieldValue: (name: string) => unknown;
	setFieldValue: (name: string, value: unknown) => void;
	setFieldsValue: (values: FormValues) => void;
};

type BookingFormProps = {
	children: React.ReactNode;
	initialValues?: FormValues;
	onSubmit: (values: FormValues) => void | Promise<void>;
	className?: string;
};

function validateWithRules(
	value: unknown,
	rules: FieldRule[]
): string | undefined {
	for (const rule of rules) {
		if (rule.required) {
			const isEmpty =
				value === undefined ||
				value === null ||
				value === '' ||
				(Array.isArray(value) && value.length === 0);

			if (isEmpty) {
				return rule.message;
			}
		}

		if (rule.type === 'email' && value) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(String(value))) {
				return rule.message;
			}
		}

		if (rule.pattern && value && !rule.pattern.test(String(value))) {
			return rule.message;
		}

		if (rule.type === 'number' && value !== undefined && value !== '') {
			const num = Number(value);
			if (Number.isNaN(num)) {
				return rule.message;
			}
			if (rule.min !== undefined && num < rule.min) {
				return rule.message;
			}
			if (rule.max !== undefined && num > rule.max) {
				return rule.message;
			}
		}
	}

	return undefined;
}

export function BookingForm({
	children,
	initialValues,
	onSubmit,
	className,
}: BookingFormProps) {
	const form = useForm<FormValues>({
		defaultValues: initialValues ?? {},
		mode: 'onSubmit',
		reValidateMode: 'onChange',
	});

	React.useEffect(() => {
		if (!initialValues || Object.keys(initialValues).length === 0) {
			return;
		}

		// Mirrors antd form.setFieldsValue merge behavior for prefilled fields.
		Object.entries(initialValues).forEach(([name, value]) => {
			form.setValue(name, value, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: false,
			});
		});
	}, [form, initialValues]);

	return (
		<ShadcnForm {...form}>
			<form
				className={className}
				onSubmit={form.handleSubmit(async (values) => {
					await onSubmit(values);
				})}
			>
				{children}
			</form>
		</ShadcnForm>
	);
}

export function useBookingFormInstance(): FormInstance {
	const form = useFormContext<FormValues>();

	return {
		getFieldValue: (name) => form.getValues(name),
		setFieldValue: (name, value) => {
			form.setValue(name, value, {
				shouldDirty: true,
				shouldTouch: true,
				shouldValidate: true,
			});
		},
		setFieldsValue: (values) => {
			Object.entries(values).forEach(([name, value]) => {
				form.setValue(name, value, {
					shouldDirty: true,
					shouldTouch: true,
					shouldValidate: true,
				});
			});
		},
	};
}

export function useBookingFormWatch(name: string): unknown {
	const form = useFormContext<FormValues>();

	return useWatch({
		control: form.control,
		name,
	});
}

type BookingFormItemShouldUpdateProps = {
	children: (helpers: {
		getFieldValue: (name: string) => unknown;
	}) => React.ReactNode;
};

/** Mirrors Ant Design Form.Item noStyle + shouldUpdate */
export function BookingFormItemShouldUpdate({
	children,
}: BookingFormItemShouldUpdateProps) {
	const form = useFormContext<FormValues>();
	useWatch({ control: form.control });

	return (
		<>
			{children({
				getFieldValue: (name) => form.getValues(name),
			})}
		</>
	);
}

type BookingFormItemProps = {
	name: string;
	rules?: FieldRule[];
	label?: React.ReactNode;
	hidden?: boolean;
	initialValue?: unknown;
	shouldUnregister?: boolean;
	style?: React.CSSProperties;
	valuePropName?: string;
	getValueFromEvent?: (...args: unknown[]) => unknown;
	validateTrigger?: Array<'onChange' | 'onBlur'>;
	children: React.ReactElement;
};

export function BookingFormItem({
	name,
	rules = [],
	label,
	hidden,
	initialValue,
	shouldUnregister = false,
	style,
	valuePropName = 'value',
	getValueFromEvent,
	validateTrigger = ['onChange', 'onBlur'],
	children,
}: BookingFormItemProps) {
	const form = useFormContext<FormValues>();
	const rulesRef = React.useRef(rules);
	rulesRef.current = rules;
	const triggerOnChange = validateTrigger.includes('onChange');
	const triggerOnBlur = validateTrigger.includes('onBlur');

	return (
		<Controller
			name={name}
			control={form.control}
			shouldUnregister={shouldUnregister}
			defaultValue={initialValue}
			rules={{
				validate: (value) => {
					const error = validateWithRules(value, rulesRef.current);
					return error || true;
				},
			}}
			render={({ field, fieldState }) => {
				const handleChange = (...args: unknown[]) => {
					let nextValue: unknown;

					if (getValueFromEvent) {
						nextValue = getValueFromEvent(...args);
					} else if (
						args[0] &&
						typeof args[0] === 'object' &&
						'target' in (args[0] as object)
					) {
						const target = (args[0] as { target: Record<string, unknown> })
							.target;
						nextValue =
							valuePropName === 'checked'
								? target.checked
								: target.value;
					} else {
						nextValue = args[0];
					}

					field.onChange(nextValue);

					if (triggerOnChange) {
						form.trigger(name);
					}
				};

				const childProps: Record<string, unknown> = {
					[valuePropName]:
						valuePropName === 'checked'
							? Boolean(field.value)
							: field.value,
					onChange: handleChange,
					onBlur: () => {
						field.onBlur();
						if (triggerOnBlur) {
							form.trigger(name);
						}
					},
				};

				if (hidden) {
					return <></>;
				}

				return (
					<div style={style}>
						{label}
						{React.cloneElement(children, childProps)}
						{fieldState.error?.message ? (
							<p className="text-[0.8rem] font-medium text-destructive">
								{String(fieldState.error.message)}
							</p>
						) : null}
					</div>
				);
			}}
		/>
	);
}
