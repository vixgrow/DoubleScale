
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ContactAddIcon from '@doublescale/shared/icons/contact-add';
import { CustomDialogHeader } from '@doublescale/components';

import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { Loader2 } from 'lucide-react';
import { isEmail } from 'validator';

// Mock Icons (replace with your actual icons)


export function AddContactDialog({ open, onClose, onSubmit, isLoading = false }) {
  // const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { firstName: '', lastName: '', email: '' },
  });

  const handleFormSubmit = async (data) => {
    await onSubmit?.(data);
    // Don't close or reset here - let the parent handle it after successful creation
  };

  const handleCancel = () => {
    onClose();
    reset();
  };


  const onFormSubmit = handleSubmit(handleFormSubmit);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && !isLoading && handleCancel()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => isLoading && e.preventDefault()} onEscapeKeyDown={(e) => isLoading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle asChild>
            <CustomDialogHeader
              title={__('Create contact', 'doublescale')}
              subtitle={__(
                'Add the essentials now. You can enrich the profile with lists, tags, and custom fields on the next screen.',
                'doublescale'
              )}
              icon={<span className='  text-brandPrimary'><ContactAddIcon width={24} height={24} /></span>}
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className=' text-base leading-6'>First Name<span className=' text-[#EF4444]'>*</span></Label>
            <Input
              id="firstName"
              placeholder="Lowarooo"
              {...register('firstName', {
                required: 'First name is required',
              })}

            />
            {errors.firstName && (
              <p className="text-red-500 text-xs">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className=' text-base leading-6'>Last Name<span className=' text-[#EF4444]'>*</span></Label>
            <Input
              id="lastName"
              placeholder="David"
              {...register('lastName', {
                required: 'Last name is required',
              })}

            />
            {errors.lastName && (
              <p className="text-red-500 text-xs">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className=' text-base leading-6'>Email<span className=' text-[#EF4444]'>*</span></Label>
            <Input
              id="email"

              placeholder="LowaroooDavig@gmail.com"
              {...register('email', {
                required: 'Email is required',
                setValueAs: (value) =>
                  typeof value === 'string' ? value.trim() : value,
                validate: (value) => {
                  const v = typeof value === 'string' ? value : '';
                  if (!v) {
                    return 'Email is required';
                  }
                  return isEmail(v) || 'Invalid email address';
                },
              })}
              type="email"
             className='h-10 py-3 shadow-none !rounded-[8px] !border-border focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-brandPrimary/20 focus-visible:!border-brandPrimary  !bg-white'
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={onFormSubmit}
              disabled={isLoading}
              variant="default"

            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {__('Saving…', 'doublescale')}
                </>
              ) : (
                __('Create contact', 'doublescale')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
