import { getServerSideSitemapIndex } from 'next-sitemap';

export const getServerSideProps = async (ctx) => {

    return getServerSideSitemapIndex(ctx, [
        `${process.env.NEXT_PUBLIC_CLIENT_URL}/sitemap.xml`,
        `${process.env.NEXT_PUBLIC_CLIENT_URL}/courses/sitemap.xml`,
        `${process.env.NEXT_PUBLIC_CLIENT_URL}/posts/sitemap.xml`
    ]);
};

export default function SitemapIndex() { };