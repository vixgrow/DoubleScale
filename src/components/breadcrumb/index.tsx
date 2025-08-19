import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';

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
}: {
	items: { label: string; href?: string }[];
}) {
	const navigate = useNavigate();
	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => (
					<>
						<BreadcrumbItem key={index}>
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
											navigate(getToLink(item.href ?? ''))
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
