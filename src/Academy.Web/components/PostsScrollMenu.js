import { useRouter } from 'next/router';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { AspectRatio } from 'react-aspect-ratio';
import { useAppSettings } from '../utils/appSettings';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import { BsChevronRight, BsChevronLeft } from 'react-icons/bs';

import DocumentViewer from '../components/DocumentViewer';
import ShareButtons from '../components/ShareButtons';
import { useRouterQuery } from 'next-router-query';
import { createHttpClient, useClient } from '../utils/client';
import { withAsync, withRemount } from '../utils/hooks';
import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';

import PostItem from '../components/PostItem';

import ResponsiveEllipsis from 'react-lines-ellipsis/lib/loose';

import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import Loader from '../components/Loader';

import { SvgWebSearchIllus } from '../resources/images/illustrations';
import { useEventDispatcher } from '../utils/eventDispatcher';


const ScrollItem = ({ children }) => <>{children}</>;

const ScrollLeftArrow = (() => {
    const {
        isFirstItemVisible,
        scrollPrev,
        visibleItemsWithoutSeparators,
        initComplete
    } = useContext(VisibilityContext);

    const [disabled, setDisabled] = useState(
        !initComplete || (initComplete && isFirstItemVisible)
    );

    useEffect(() => {
        // NOTE: detect if whole component visible
        if (visibleItemsWithoutSeparators.length) {
            setDisabled(isFirstItemVisible);
        }
    }, [isFirstItemVisible, visibleItemsWithoutSeparators]);

    return (<div className={`d-none d-sm-flex align-items-center py-1 pe-3 mt-n1 cursor-pointer pe-auto ${disabled ? 'invisible' : ''}`} onClick={() => scrollPrev()}><span className="svg-icon svg-icon-xs"><BsChevronLeft /></span></div>);
});

const ScrollRightArrow = () => {
    const {
        isLastItemVisible,
        scrollNext,
        visibleItemsWithoutSeparators
    } = useContext(VisibilityContext);

    // console.log({ isLastItemVisible });
    const [disabled, setDisabled] = useState(
        !visibleItemsWithoutSeparators.length && isLastItemVisible
    );
    useEffect(() => {
        if (visibleItemsWithoutSeparators.length) {
            setDisabled(isLastItemVisible);
        }
    }, [isLastItemVisible, visibleItemsWithoutSeparators]);


    return (<div className={`d-none d-sm-flex align-items-center py-1 ps-3 mt-n1 cursor-pointer pe-auto ${disabled ? 'invisible' : ''}`} onClick={() => scrollNext()}><span className="svg-icon svg-icon-xs"><BsChevronRight /></span></div>);
}


const PostsScrollMenu = withRemount(({ search, remount }) => {
    const router = useRouter();
    const client = useClient();
    const [loading, setLoading] = useState({});
    const [page, setPage] = useState(null);
    const appSettings = useAppSettings();
    const eventDispatcher = useEventDispatcher();

    const load = async (params) => {
        setLoading({});
        setPage(null);

        let result = await client.get(`/posts`, { params });

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load posts.', remount });
            return;
        }

        setPage(result.data);
        setLoading(null);
    };

    useEffect(() => { load(search); }, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            {(!loading && page.items.length) ? (
                <ScrollMenu
                    LeftArrow={ScrollLeftArrow}
                    RightArrow={ScrollRightArrow}
                    wrapperClassName=""
                    scrollContainerClassName="">
                    {page.items.map((item, index) => {
                        return (
                            <ScrollItem key={`scroll-item-${index}`} itemId={`scroll-item-${index}`}>
                                <div className="mx-2" style={{ width: "256px" }}>
                                    <PostItem post={item} responsive={false} />
                                </div>
                            </ScrollItem>
                        );
                    })}
                </ScrollMenu>
            )
                : ((!loading && !page.items.length) ?
                    (<>
                        <div className="d-flex flex-column text-center justify-content-center pt-10 mt-10">
                            <div className="mb-4">
                                <SvgWebSearchIllus style={{ width: "auto", height: "128px" }} />
                            </div>
                            <div className="mb-3">There are no posts here.</div>
                        </div>
                    </>)
                    : (<Loader {...loading} />)
                )}
        </>
    )
});

export default PostsScrollMenu;