import { getServerSideSitemap } from 'next-sitemap';
import { createHttpClient } from '../../../utils/client';

export const getServerSideProps = async (ctx) => {
    const httpClient = createHttpClient({ throwIfError: false }, ctx);
    const result = (await httpClient.get(`/courses/info`));
    let items = null;

    if (result.error) {
        items = [];
    }
    else {
        items = result.data.map(item => ({
            loc: `${process.env.NEXT_PUBLIC_CLIENT_URL}/courses/${item.id}`,
            lastmod: new Date(Date.parse(item.updated || item.created)).toISOString(),
            changefreq: 'hourly',
            priority: 1
        }));
    }

    return getServerSideSitemap(ctx, items);
}

// Default export to prevent next.js errors
export default function Sitemap() { }