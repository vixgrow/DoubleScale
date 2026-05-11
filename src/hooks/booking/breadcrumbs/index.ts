/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';

export interface Breadcrumb {
    path: string;
    title: string;
}

const useBreadcrumbs = () => {
    const { setBreadcrumbs } = useDispatch('doublescale/core');

    /**
     * Updates multiple breadcrumbs in the store.
     *
     * @param breadcrumbs - An array of breadcrumb objects.
     */
    const updateBreadcrumbs = (breadcrumbs: Breadcrumb[]) => {
        const breadcrumbObject = breadcrumbs.reduce((acc, breadcrumb) => {
            acc[breadcrumb.path] = breadcrumb.title;
            return acc;
        }, {} as Record<string, string>);

        setBreadcrumbs(breadcrumbObject);
    };

    return updateBreadcrumbs;
};

export default useBreadcrumbs;