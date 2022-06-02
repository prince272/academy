import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { AspectRatio } from 'react-aspect-ratio';
import { useAppSettings } from '../../../utils/appSettings';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import { BsCalendarDate, BsCardImage, BsClock, BsPersonFill, BsChevronRight, BsChevronLeft, BsCupStraw } from 'react-icons/bs';

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
import { Collapse } from 'react-bootstrap';

import { ReactionBarSelector } from '@charkour/react-reactions';
import ReactionSelector from '../../../components/ReactionSelector';

const ProfileInfo = ({ profile }) => {
    const client = useClient();
    const permitted = (client.user && client.user.id == profile.id);
    const [showContact, setShowContact] = useState(false);

    return (
        <div className="row gy-3">
            <div className="col-md-auto d-flex d-md-block justify-content-center">
                <div className="border rounded bg-white p-1 d-inline-flex">
                    {profile.avatar ?
                        (<Image className="rounded" priority unoptimized loader={({ src }) => src} src={profile.avatar.url} layout="fixed" objectFit="cover" width={128} height={128} alt={profile.fullName} />) :
                        (<div className="rounded svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center" style={{ width: "128px", height: "128px" }}><BsCardImage /></div>)}
                </div>
            </div>
            <div className="col-md-9">
                <div className="h2 fw-bold text-center text-md-start">{profile.fullName}</div>
                <div className="mb-3 text-start">{profile.bio}</div>
                <div className="mb-3 d-flex mx-n2">
                    <button type="button" className="btn btn-outline-dark btn-sm w-100 w-md-auto mx-2" onClick={() => setShowContact(!showContact)}>{showContact ? 'Hide' : 'Show'} contact</button>
                    <button type="button" className="btn btn-dark btn-sm w-100 w-md-auto mx-2">Buy me a coffee</button>
                </div>
                <Collapse in={showContact}>
                    <div>
                        {permitted && <div className="mb-3"><Link href={`${ModalPathPrefix}/accounts/profile/edit`}><a>Edit profile</a></Link></div>}
                        <SocialButtons social={profile || {}} />
                    </div>
                </Collapse>
            </div>
        </div>
    )
}

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
                setLoading({ ...error, message: 'Unable to load post.', fallback: () => router.replace('/posts'), remount });
                return;
            }

            post = await setPost(result.data);
            await setReactionType(post.reactionType);
            await setLoading(null);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return (<Loader {...loading} />);


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
                    <div className="col-12 col-md-8 align-self-start">
                        <div>
                            <div>
                                <div className="mb-3"><Link href="/posts"><a className="link-dark d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs me-1"><BsChevronLeft /></div><div>Back to posts</div></a></Link></div>
                                <div className="hstack gap-3 flex-wrap justify-content-between mb-3">
                                    <div>
                                        <div className="hstack text-nowrap">
                                            <div><span className="text-primary align-text-bottom"><BsCalendarDate /></span> {moment(post.created).format("MMMM D, yyyy")}</div>
                                            <span className="mx-2">•</span>
                                            <div><span className="text-primary align-text-bottom"><BsClock /></span> {moment.duration(Math.floor(post.duration / 10000)).humanize()} to read</div>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center"><div className="me-2 fw-bold">Share:</div><ShareButtons share={{ title: post.title, text: post.description, url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/posts/${postId}` }} /> </div>
                                </div>
                                <div className="hstack gap-3 flex-wrap mb-1">
                                    <div className="badge bg-primary fs-6">{appSettings.post.categories.find(category => category.value == post.category)?.name}</div>
                                </div>
                                <h1 className="h1">{post.title}</h1>
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
                        <div className="vstack gap-3 align-items-center text-center pt-4 pb-3">
                            <ReactionSelector reactions={post.reactions} value={post.reactionType} onChange={async (type) => {
                                await client.post(`/posts/${postId}/reaction`, { type });
                            }} />
                        </div>
                        <div className="divider-center my-6 h5 text-reset">About</div>
                        <ProfileInfo profile={(client.user && client.user.id == post.teacher.id) ? client.user : post.teacher} />
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