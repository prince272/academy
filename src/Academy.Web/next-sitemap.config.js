module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_CLIENT_URL,
  generateRobotsTxt: true,
  exclude: [
    '/sitemap.xml',
    '/courses/sitemap.xml',
    '/posts/sitemap.xml'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_CLIENT_URL}/sitemap.xml`,
      `${process.env.NEXT_PUBLIC_CLIENT_URL}/courses/sitemap.xml`,
      `${process.env.NEXT_PUBLIC_CLIENT_URL}/posts/sitemap.xml`,
    ],
  }
}