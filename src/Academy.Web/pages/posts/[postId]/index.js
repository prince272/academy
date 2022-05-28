import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { AspectRatio } from 'react-aspect-ratio';
import { useAppSettings } from '../../../utils/appSettings';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import { BsCalendarDate, BsCardImage, BsClock, BsPersonFill, BsChevronRight, BsChevronLeft } from 'react-icons/bs';

import DocumentViewer from '../../../components/DocumentViewer';
import ShareButtons from '../../../components/ShareButtons';
import { useRouterQuery } from 'next-router-query';
import { createHttpClient, useClient } from '../../../utils/client';
import { withAsync, withRemount } from '../../../utils/hooks';
import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';

import PostItem from '../../../components/PostItem';

import ResponsiveEllipsis from 'react-lines-ellipsis/lib/loose';

import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import Loader from '../../../components/Loader';

import { SvgWebSearchIllus } from '../../../resources/images/illustrations';
import { useEventDispatcher } from '../../../utils/eventDispatcher';

import parsePhoneNumber from 'libphonenumber-js';
import { ModalPathPrefix } from '../../../modals';

import SocialButtons from '../../../components/SocialButtons';
import PostsScrollMenu from '../../../components/PostsScrollMenu';

const PostPage = withRemount(({ remount, ...props }) => {
    const router = useRouter();
    const client = useClient();

    const { postId } = useRouterQuery();
    let [post, setPost] = withAsync(useState(props.post));
    const [loading, setLoading] = withAsync(useState(props.loading));

    const appSettings = useAppSettings();

    const load = async () => {
        if (loading) {

            let result = await client.get(`/posts/${postId}`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load post.', remount });
                return;
            }

            post = await setPost(result.data);
            await setLoading(null);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const permitted = (client.user && client.user.id == post.teacher.id);

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
                <div className="row h-100">
                    <div className="col-12 col-md-10 align-self-start">
                        <div>
                            <div>
                                <div className="mb-3"><Link href="/posts"><a className="link-dark d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs me-1"><BsChevronLeft /></div><div>Back to posts</div></a></Link></div>
                                <div className='mb-3'><div className="badge bg-primary fs-6">{appSettings.post.categories.find(category => category.value == post.category)?.name}</div></div>
                                <h1 className="h2">{post.title}</h1>
                                <div className="hstack text-nowrap mb-3">
                                    <div><span className="text-primary align-text-bottom"><BsCalendarDate /></span> {moment(post.created).format("MMMM D, yyyy")}</div>
                                    <span className="mx-2">•</span>
                                    <div><span className="text-primary align-text-bottom"><BsClock /></span> {moment.duration(Math.floor(post.duration / 10000)).humanize()} to read</div>
                                </div>
                                <div className="d-inline-flex align-items-center mb-3 me-2">
                                    {(() => {
                                        const teacher = (client.user && client.user.id == post.teacher.id) ? client.user : post.teacher;
                                        return (
                                            <>
                                                {teacher.avatar ?
                                                    (<Image className="rounded-pill" priority unoptimized loader={({ src }) => src} src={teacher.avatar.url} width={24} height={24} objectFit="cover" alt={`${teacher.fullName}`} />) :
                                                    (
                                                        <div className="rounded-pill d-flex align-items-center justify-content-center bg-light text-dark" style={{ width: "24px", height: "24px" }}>
                                                            <div className="svg-icon svg-icon-xs d-inline-block" ><BsPersonFill /></div>
                                                        </div>
                                                    )}
                                                <ResponsiveEllipsis className="overflow-hidden text-break fst-italic ms-2"
                                                    text={teacher.fullName}
                                                    maxLine='1'
                                                    ellipsis='...'
                                                    trimRight
                                                    basedOn='letters'
                                                />
                                            </>
                                        )
                                    })()}

                                </div>
                                <div className="mb-3 d-flex align-items-center"><div className="me-2 fw-bold">Share:</div><ShareButtons share={{ title: post.title, text: post.description, url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/posts/${postId}` }} /> </div>
                                <div className="p-1 mb-3">
                                    <AspectRatio ratio="1280/720">
                                        {post.image ?
                                            (<Image className="rounded border" priority unoptimized loader={({ src }) => src} src={post.image.url} layout="fill" objectFit="cover" alt={post.title} />) :
                                            (<div className="rounded border svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center"><BsCardImage /></div>)}
                                    </AspectRatio>
                                </div>
                                <div className="fs-5"><DocumentViewer document={post.description} /></div>
                            </div>
                        </div>
                        <div className="divider-center my-6 h5">About</div>
                        {(() => {
                            const teacher = (client.user && client.user.id == post.teacher.id) ? client.user : post.teacher;

                            return (
                                <div className="row gy-3">
                                    <div className="col-md-auto d-flex d-md-block justify-content-center">
                                        <div className="border rounded bg-white p-1 d-inline-flex">
                                            {teacher.avatar ?
                                                (<Image className="rounded" priority unoptimized loader={({ src }) => src} src={teacher.avatar.url} layout="fixed" objectFit="cover" width={128} height={128} alt={post.teacher.fullName} />) :
                                                (<div className="rounded svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center" style={{ width: "128px", height: "128px" }}><BsCardImage /></div>)}
                                        </div>
                                    </div>
                                    <div className="col-md-9">
                                        <div className="h2 fw-bold text-center text-md-start">{teacher.fullName}</div>
                                        <div className="mb-2 text-start">{teacher.bio}</div>
                                        {permitted && <div className="mb-2"><Link href={`${ModalPathPrefix}/accounts/profile/edit`}><a>Edit profile</a></Link></div>}
                                        <div className="text-start">
                                            <div className="">
                                                {teacher.email && (
                                                    <p className="text-nowrap mb-2">Email: <a href={`mailto:${teacher.email}`}>{teacher.email}</a></p>
                                                )}
                                                {teacher.phoneNumber && (
                                                    <p className="text-nowrap mb-2">Phone number: {((phoneNumber) => (<a href={phoneNumber.getURI()}>{phoneNumber.formatInternational()}</a>))(parsePhoneNumber(appSettings.company.phoneNumber))}</p>
                                                )}
                                                <div>
                                                    <SocialButtons social={client.user || {}} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                        <hr className="my-6" />
                        <div className="hstack gap-3 justify-content-between mb-3">
                            <div className="h5">Related posts</div>
                            <div className="h5"><Link href="/posts"><a>All posts <span className="svg-icon svg-icon-xs d-inline-block align-text-bottom me-2"><BsChevronRight /></span></a></Link></div>
                        </div>
                        <PostsScrollMenu search={{ relatedId: post.id }} />
                    </div>
                </div>
            </div>
        </>
    );
});

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