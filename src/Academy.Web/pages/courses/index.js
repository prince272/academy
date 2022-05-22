import _ from 'lodash';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useContext, useEffect, useRef, useState } from 'react';
import { useClient } from '../../utils/client';
import { useAlternativePrevious, withAsync, withRemount } from '../../utils/hooks';
import Loader from '../../components/Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsPlus, BsBookHalf, BsCaretDownFill, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../../modals';
import { CourseItem } from '../../components/courses';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import { useForm } from 'react-hook-form';
import { sentenceCase } from 'change-case';
import { useAppSettings } from '../../utils/appSettings';
import InfiniteScroll from 'react-infinite-scroll-component';
import { cleanObject, preventDefault } from '../../utils/helpers';
import { SvgWebSearchIllus } from '../../resources/images/illustrations';
import { useEventDispatcher } from '../../utils/eventDispatcher';
import { useQueryState } from 'next-usequerystate';

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

const CoursesPage = withRemount((props) => {
    const { remount } = props;
    const modal = useModal();
    const [loading, setLoading] = useState({});
    const [page, setPage] = useState(null);
    const router = useRouter();
    const client = useClient();
    const eventDispatcher = useEventDispatcher();

    const appSettings = useAppSettings();

    const scrollApiRef = useRef();
    const [mounted, setMounted] = useState(false);

    const [subject, setSubject] = useQueryState('subject');
    const [sort, setSort] = useQueryState('sort');

    const searchProps = { subject, sort };
    const prevSearchProps = useAlternativePrevious(searchProps);

    const load = async (params, next) => {
        setLoading({});

        let result = await client.get(`/courses`, { params });

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load courses.', remount });
            return;
        }

        setPage(page => next ? ({ ...result.data, items: (page?.items || []).concat(result.data.items) }) : result.data);
        setLoading(null);
    };

    useEffect(async () => {
        setMounted(true);
    }, []);

    useEffect(async () => { await load(cleanObject(searchProps || {})); }, [prevSearchProps]);

    useEffect(() => {

        const crud = (source, path, item, action) => {
            const items = _.get(source, path);

            if (action == 'add') {
                items.push(item);
            }
            else {
                const index = items.findIndex(_item => _item.id == item.id);

                if (index > -1) {
                    if (action == 'edit') items[index] = item;
                    else if (action == 'delete') items.splice(index, 1);
                }
            }

            return source;
        }

        const handleAddCourse = (course) => {
            setPage(page => crud(page, 'items', course, 'add'));
        };
        const handleEditCourse = (course) => {
            setPage(page => crud(page, 'items', course, 'edit'));
        };
        const handleDeleteCourse = (course) => {
            setPage(page => crud(page, 'items', course, 'delete'));
        };

        eventDispatcher.on('addCourse', handleAddCourse);
        eventDispatcher.on('editCourse', handleEditCourse);
        eventDispatcher.on('deleteCourse', handleDeleteCourse);

        return () => {
            eventDispatcher.off('addCourse', handleAddCourse);
            eventDispatcher.off('editCourse', handleEditCourse);
            eventDispatcher.off('deleteCourse', handleDeleteCourse);
        }
    }, []);

    useEffect(() => {

        const handleSigninComplete = (state) => {
            remount();
        };

        const handleSignoutComplete = (state) => {
            remount();
        };

        eventDispatcher.on('signinComplete', handleSigninComplete);
        eventDispatcher.on('signoutComplete', handleSignoutComplete);

        return () => {
            eventDispatcher.off('signinComplete', handleSigninComplete);
            eventDispatcher.off('signoutComplete', handleSignoutComplete);
        };
    }, []);

    const permitted = (client.user && (client.user.roles.some(role => role == 'admin') || (client.user.roles.some(role => role == 'teacher'))));

    return (
        <>
            <NextSeo title="Courses" />
            <div className="container h-100 py-3">
                <div className="d-flex align-items-center pt-2 pb-3">
                    <div className="h3 mb-0">Courses ({page?.items.length || 0})</div>
                </div>
                <div className="mb-3">
                    <ScrollMenu
                        onInit={() => {
                            scrollApiRef.current.scrollToItem(
                                scrollApiRef.current.getItemById(`scroll-item-${searchProps.subject}`),
                                "auto",
                                "start"
                            );
                        }}
                        apiRef={scrollApiRef}
                        key={String(mounted)}
                        LeftArrow={ScrollLeftArrow}
                        RightArrow={ScrollRightArrow}

                        wrapperClassName=""
                        scrollContainerClassName="">
                        {[{ name: 'All', value: null }, ...appSettings.course.subjects].map((subjectObj) => {
                            return (
                                <ScrollItem key={`scroll-item-${subjectObj.value}`} itemId={`scroll-item-${subjectObj.value}`}>
                                    <a className={`btn btn-sm ${subjectObj.value == searchProps.subject ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill mx-1 text-nowrap`} onClick={preventDefault(() => setSubject(subjectObj.value))}>
                                        {subjectObj.name}
                                    </a>
                                </ScrollItem>
                            );
                        })}
                    </ScrollMenu>
                </div>
                <div>
                    {(!loading && page.items.length) ? (
                        <InfiniteScroll
                            className="row gy-3"
                            dataLength={page.items.length}
                            next={() => load({ ...searchProps, pageNumber: page.pageNumber + 1 }, true)}
                            hasMore={(page.pageNumber + 1) <= page.totalPages}
                            loader={<Loader {...loading} />}>
                            {page.items.map((course) => {
                                const courseId = course.id;
                                return (
                                    <div key={courseId} className="col-12 col-sm-6 col-md-4 col-lg-3">
                                        <CourseItem course={course} />
                                    </div>
                                );
                            })}
                        </InfiniteScroll>

                    )
                        : ((!loading && !page.items.length) ?
                            (<>
                                <div className="d-flex flex-column text-center justify-content-center pt-10 mt-10">
                                    <div className="mb-4">
                                        <SvgWebSearchIllus style={{ width: "auto", height: "128px" }} />
                                    </div>
                                    <div className="mb-3">There are no courses here.</div>
                                    {!permitted && <div><Link href={{ pathname: `${ModalPathPrefix}/contact` }}><a className="btn btn-outline-primary mb-3">Request a course</a></Link></div>}
                                    {permitted && <div><Link href={{ pathname: `${ModalPathPrefix}/courses/add` }}><a className="btn btn-outline-primary mb-3">Add a course</a></Link></div>}
                                </div>
                            </>)
                            : (<Loader {...loading} />)
                        )}
                </div>
            </div>
            {permitted &&
                (<div className="position-fixed bottom-0 end-0 w-100 zi-3 pe-none">
                    <div className="container py-3">
                        <div className="row justify-content-center">
                            <div className="col-12">
                                <div className="d-flex justify-content-end">
                                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Add course</Tooltip>}>
                                        {({ ...triggerHandler }) => (

                                            <Link href={`${ModalPathPrefix}/courses/add`}>
                                                <a className="btn btn-primary btn-icon rounded-pill pe-auto" {...triggerHandler}>
                                                    <span className="svg-icon svg-icon-sm d-inline-block" ><BsPlus /></span>
                                                </a>
                                            </Link>
                                        )}
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>)
            }
        </>
    );
});

CoursesPage.getPageSettings = () => {
    return ({
        showFooter: false
    });
}

export default CoursesPage;