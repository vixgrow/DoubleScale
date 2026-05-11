import { useNavigate, getToLink } from '@doublescale/navigation';
import React from 'react';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function BreadcrumbComponent({
	items,
	handleNavigate,
}: {
	items: { label: string; href?: string }[];
	handleNavigate?: (href: string) => void;
}) {
	const navigate = handleNavigate ? handleNavigate : useNavigate();
	return (
		<Breadcrumb>
			<BreadcrumbList className="items-center gap-2">
				{items.map((item, index) => (
					<React.Fragment key={index}>
						<BreadcrumbItem className="mb-0 inline-flex items-center leading-none">
							{index === items.length - 1 ? (
								<BreadcrumbPage className="text-muted-foreground leading-none">
									{item.label}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									asChild
									className="font-semibold text-foreground leading-none hover:text-primary"
								>
									<div
										className="inline-flex cursor-pointer items-center leading-none"
										onClick={() =>
											handleNavigate
												? handleNavigate(
														item.href ?? ''
													)
												: navigate(
														getToLink(
															item.href ?? ''
														)
													)
										}
									>
										{item.label}
									</div>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{index !== items.length - 1 && (
							<BreadcrumbSeparator className="self-center" />
						)}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
