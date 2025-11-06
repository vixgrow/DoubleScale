/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';

/**
 * external dependencies
 */

/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductBlockProps } from '..';
import { ProductBlockIcon } from '@quillcrm/components';

interface WooCommerceProduct {
	id: number;
	name: string;
	price: string;
	regular_price: string;
	sale_price: string;
	images: Array<{
		src: string;
		alt: string;
	}>;
	short_description: string;
	permalink: string;
}

interface ProductSelectionDialogProps {
	props: ProductBlockProps;
	onChange: (updates: Partial<ProductBlockProps>) => void;
	children: React.ReactNode;
}

export const ProductSelectionDialog: React.FC<ProductSelectionDialogProps> = ({
	props: _props,
	onChange,
	children,
}) => {
	// Helper function to strip HTML tags and entities from price strings
	const stripHtmlTags = (htmlString: string): string => {
		if (!htmlString) return '';

		// Create a temporary DOM element to decode HTML entities
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = htmlString;

		// Get text content and clean it up
		let cleanText = tempDiv.textContent || tempDiv.innerText || '';

		// Remove any remaining HTML tags (fallback)
		cleanText = cleanText.replace(/<[^>]*>/g, '');

		// Clean up extra whitespace and normalize spaces
		cleanText = cleanText.replace(/\s+/g, ' ').trim();

		return cleanText;
	};
	const [isOpen, setIsOpen] = useState(false);
	const [products, setProducts] = useState<WooCommerceProduct[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [error, setError] = useState<string | null>(null);

	// Fetch WooCommerce products using single endpoint
	const fetchProducts = async (search = '') => {
		setLoading(true);
		setError(null);
		console.log('🔍 Fetching products with search:', search);

		try {
			// Use WooCommerce REST API v3 as the single endpoint
			const data = await apiFetch({
				path: `/wc/v3/products?per_page=20&status=publish${search ? `&search=${encodeURIComponent(search)}` : ''}`,
			});

			console.log('📦 Raw API response:', data);

			if (Array.isArray(data)) {
				const transformedProducts: WooCommerceProduct[] = data.map(
					(product: any) => ({
						id: product.id,
						name: product.name,
						price:
							stripHtmlTags(product.price_html) ||
							`${product.price} ${product.currency || 'EGP'}`,
						regular_price: product.regular_price,
						sale_price: product.sale_price,
						images: product.images || [],
						short_description: product.short_description
							? product.short_description
									.replace(/<[^>]*>/g, '')
									.substring(0, 100)
							: '',
						permalink: product.permalink,
					})
				);

				console.log('📦 Transformed products:', transformedProducts);
				setProducts(transformedProducts);

				if (transformedProducts.length === 0) {
					setError(
						'No products found. Make sure WooCommerce is installed and you have published products.'
					);
				}
			} else {
				setError('Invalid response format from WooCommerce API.');
			}
		} catch (error) {
			console.error('❌ Error fetching products:', error);
			setError(
				error instanceof Error
					? error.message
					: 'Failed to fetch products. Please ensure WooCommerce is installed and activated.'
			);

			// Set empty products array instead of fallback
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	// Load products when dialog opens
	useEffect(() => {
		if (isOpen) {
			fetchProducts(searchTerm);
		}
	}, [isOpen]);

	// Handle search with debouncing
	useEffect(() => {
		if (!isOpen) return;

		const timeoutId = setTimeout(() => {
			fetchProducts(searchTerm);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchTerm, isOpen]);

	// Handle product selection
	const handleProductSelect = (product: WooCommerceProduct) => {
		const primaryImage =
			product.images && product.images.length > 0
				? product.images[0]
				: null;

		// Format price with currency
		const cleanPrice = stripHtmlTags(
			product.sale_price || product.regular_price || product.price
		);
		const priceWithCurrency = cleanPrice ? `${cleanPrice} EGP` : '';

		onChange({
			productId: product.id, // Save WooCommerce product ID
			imageSrc: primaryImage?.src || '',
			imageAlt: primaryImage?.alt || product.name,
			title: product.name,
			description: product.short_description || '',
			price: priceWithCurrency,
			buttonLink: product.permalink,
		});

		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{__('Select WooCommerce Product', 'quillcrm')}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Input
							placeholder={__('Search products...', 'quillcrm')}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>

					{/* Products List */}
					<div className="max-h-96 overflow-y-auto space-y-2">
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<div className="text-sm text-gray-500">
									{__('Loading products...', 'quillcrm')}
								</div>
							</div>
						) : error ? (
							<div className="flex flex-col items-center justify-center py-8 space-y-2">
								<div className="text-sm text-red-600">
									{error}
								</div>
							</div>
						) : products.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 space-y-2">
								<div className="text-sm text-gray-500">
									{__('No products found', 'quillcrm')}
								</div>
								<div className="text-xs text-gray-400 text-center max-w-md">
									{__(
										'Make sure WooCommerce is installed and activated with published products.',
										'quillcrm'
									)}
								</div>
							</div>
						) : (
							products.map((product) => {
								const primaryImage =
									product.images && product.images.length > 0
										? product.images[0]
										: null;

								return (
									<div
										key={product.id}
										className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
										onClick={() =>
											handleProductSelect(product)
										}
									>
										{/* Product Image */}
										<div className="flex-shrink-0">
											{primaryImage?.src ? (
												<img
													src={primaryImage.src}
													alt={primaryImage.alt}
													className="w-16 h-16 object-cover rounded"
													onError={(e) => {
														const target =
															e.target as HTMLImageElement;
														target.style.display =
															'none';
														target.nextElementSibling?.classList.remove(
															'hidden'
														);
													}}
												/>
											) : null}
											<div
												className={`w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400 ${primaryImage?.src ? 'hidden' : ''}`}
											>
												<ProductBlockIcon />
											</div>
										</div>

										{/* Product Details */}
										<div className="flex-1 min-w-0">
											<h4 className="text-sm font-medium text-gray-900 truncate">
												{product.name}
											</h4>
											<div className="flex items-center space-x-2 mt-1">
												<span className="text-sm font-semibold text-green-600">
													{stripHtmlTags(
														product.sale_price ||
															product.price
													)}
												</span>
												{product.sale_price &&
													product.regular_price && (
														<span className="text-xs text-gray-400 line-through">
															{stripHtmlTags(
																product.regular_price
															)}
														</span>
													)}
											</div>
										</div>

										{/* Select Button */}
										<Button
											size="sm"
											variant="outline"
											onClick={(e) => {
												e.stopPropagation();
												handleProductSelect(product);
											}}
										>
											{__('Select', 'quillcrm')}
										</Button>
									</div>
								);
							})
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
