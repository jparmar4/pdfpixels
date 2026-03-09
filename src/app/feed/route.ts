import { NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/config/blog';

export async function GET() {
  const baseUrl = 'https://www.pdfpixels.com';
  const currentDate = new Date().toUTCString();
  const blogPosts = getAllBlogPosts();

  const blogItems = blogPosts.map((post) => ({
    title: post.title,
    description: post.metaDescription || post.excerpt,
    link: `${baseUrl}/blog/${post.slug}`,
    pubDate: new Date(post.date).toUTCString(),
    category: post.category,
    author: post.author,
  }));

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title>PdfPixels - Blog and Product Guides</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/feed" rel="self" type="application/rss+xml"/>
    <description>Latest blog posts, tutorials, and workflow guides from PdfPixels.</description>
    <language>en-us</language>
    <copyright>Copyright ${new Date().getFullYear()} PdfPixels. All rights reserved.</copyright>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <generator>PdfPixels RSS Generator</generator>
    <webMaster>support@pdfpixels.com</webMaster>
    <managingEditor>support@pdfpixels.com</managingEditor>
    <category>Image Processing</category>
    <category>PDF Tools</category>
    <category>Tutorials</category>
    <ttl>60</ttl>
    <sy:updatePeriod>daily</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>${baseUrl}/icon-192.png</url>
      <title>PdfPixels</title>
      <link>${baseUrl}</link>
      <width>192</width>
      <height>192</height>
    </image>

    ${blogItems
      .map(
        (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <description>${escapeXml(item.description)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${item.link}</guid>
      <dc:creator>${escapeXml(item.author)}</dc:creator>
      <content:encoded><![CDATA[
        <p>${escapeXml(item.description)}</p>
        <p><a href="${item.link}">Read the full article on PdfPixels</a></p>
      ]]></content:encoded>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
