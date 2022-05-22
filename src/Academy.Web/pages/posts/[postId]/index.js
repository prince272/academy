import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { AspectRatio } from 'react-aspect-ratio';
import { useAppSettings } from '../../../utils/appSettings';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import { BsGripVertical, BsCardImage, BsChevronDown, BsChevronRight, BsPersonFill, BsPlus, BsThreeDots, BsCheck2, BsLockFill, BsX, BsPlayFill, BsQuestionCircle, BsJournalRichtext, BsMusicNoteBeamed, BsChevronLeft, BsAward, BsHourglassBottom, BsClockHistory, BsClockFill, BsCart, BsCart2, BsBasket2, BsCart4, BsCart3 } from 'react-icons/bs';

import DocumentViewer from '../../../components/DocumentViewer';
import { useRouterQuery } from 'next-router-query';
import { createHttpClient, useClient } from '../../../utils/client';
import { withAsync } from '../../../utils/hooks';
import { useState, useEffect } from 'react';
import Link from 'next/link';


const PostPage = (props) => {
    const router = useRouter();
    const client = useClient();

    const { postId } = useRouterQuery();
    let [post, setPost] = withAsync(useState(props.post));
    const [loading, setLoading] = withAsync(useState(props.loading));

    const load = async () => {
        if (loading) {

            let result = await client.get(`/posts/${postId}`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load post.', remount });
                return;
            }

            post = await setCourse(result.data);
            await setLoading(null);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <>
            <NextSeo
                title={post.title}
                description={post.description}
                openGraph={{
                    title: post.title,
                    description: post.description,
                    images: post.image ? [{ url: post.image.url }] : undefined,
                }}
            />
            <div className="container py-5">
                <div className="row justify-content-center h-100">
                    <div className="col-12 col-md-10 align-self-start">
                        <div className="card">
                            <div className="card-body">
                                <div className="mb-3"><Link href="/posts"><a className="link-dark d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs me-1"><BsChevronLeft /></div><div>Back to posts</div></a></Link></div>
                                <div className="hstack text-nowrap mb-1">
                                    <div><span className="text-primary"><BsClockFill /></span> {moment.duration(Math.floor(post.duration / 10000)).humanize()} read</div>
                                    <span className="mx-2">·</span>
                                    <div><span className="text-primary"><BsPersonFill /></span> 1</div>
                                </div>
                                <h1 className="h2">{post.title}</h1>
                                <div className="p-1 mb-3">
                                    <AspectRatio ratio="1280/720">
                                        {post.image ?
                                            (<Image className="rounded border" priority unoptimized loader={({ src }) => src} src={post.image.url} layout="fill" objectFit="cover" alt={post.title} />) :
                                            (<div className="rounded border svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center"><BsCardImage /></div>)}
                                    </AspectRatio>
                                </div>
                                <div className="lead"><DocumentViewer document={post.description} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

PostPage.getPageSettings = () => {
    return ({
        showFooter: false
    });
}

export async function getServerSideProps(ctx) {
    const httpClient = createHttpClient({ throwIfError: false }, ctx);
    const result = (await httpClient.get(`/posts/${ctx.params.postId}`));
    return {
        props: {
            post: !result.error ? result.data : null,
            loading: result.error || null
        }, // will be passed to the page component as props
    }
}

export default PostPage;