import { useNavigate, getToLink } from '@quillcrm/navigation';

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
			<BreadcrumbList>
				{items.map((item, index) => (
					<>
						<BreadcrumbItem key={index} className="mb-0">
							{index === items.length - 1 ? (
								<BreadcrumbPage className="text-primary">
									{item.label}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									asChild
									className="hover:text-primary"
								>
									<div
										className="cursor-pointer"
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
						{index !== items.length - 1 && <BreadcrumbSeparator />}
					</>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
