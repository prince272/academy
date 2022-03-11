import _ from 'lodash';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';
import { useClient } from '../../utils/client';
import { useAlternativePrevious, withRemount } from '../../utils/hooks';
import Loader from '../../components/Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsPlus, BsBookHalf, BsCaretDownFill, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import TruncateMarkup from 'react-truncate-markup';
import { Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../../modals';
import { CourseItem } from '../../components/courses';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import { useForm } from 'react-hook-form';
import { sentenceCase } from 'change-case';
import { useAppSettings } from '../../utils/appSettings';
import InfiniteScroll from 'react-infinite-scroll-component';
import { cleanObject } from '../../utils/helpers';
import { SvgWebSearchIllus } from '../../resources/images/illustrations';
import Mounted from '../../components/Mounted';
import { useEventDispatcher } from '../../utils/eventDispatcher';

const CoursesPage = withRemount((props) => {
    const { remount } = props;
    const modal = useModal();
    const [loading, setLoading] = useState({});
    const [page, setPage] = useState(null);
    const router = useRouter();
    const client = useClient();
    const eventDispatcher = useEventDispatcher();

    const appSettings = useAppSettings();
    const search = useForm({ shouldUnregister: true });

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

    useEffect(() => {
        search.reset();
        Object.entries(router.query).forEach(([name, value]) => {
            search.setValue(name, value);
        });
        setPage(null);
        load(router.query);
    }, [router.query]);

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

    const scrollItems = (() => {
        const items = [];

        items.push(() => (
            <Dropdown className="mx-2 pe-auto">
                <Dropdown.Toggle as="div" variant=" " className="link-dark fw-bold cursor-pointer">{((item) => (item ? item.name : `Subject`))(appSettings.courseSubjects.find(item => item.value == search.watch('subject')))}</Dropdown.Toggle>
                <Dropdown.Menu style={{ margin: 0 }}>
                    {[{ name: 'Any', value: null }, ...appSettings.courseSubjects].map(item => (
                        <Link key={item.value || 'null'} href={{ pathname: router.basePath, query: cleanObject({ ...search.watch(), subject: item.value }) }} passHref><Dropdown.Item className={`cursor-pointer ${item.value == search.watch('subject') ? 'bg-soft-primary' : ''}`}>{item.name}</Dropdown.Item></Link>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        ));

        items.push(() => (
            <Dropdown className="mx-2 pe-auto">
                <Dropdown.Toggle as="div" variant=" " className="link-dark fw-bold cursor-pointer">{((item) => (item ? item.name : `Sort`))(appSettings.courseSorts.find(item => item.value == search.watch('sort')))}</Dropdown.Toggle>
                <Dropdown.Menu style={{ margin: 0 }}>
                    {[{ name: 'Any', value: null }, ...appSettings.courseSorts].map(item => (
                        <Link key={item.value || 'null'} href={{ pathname: router.basePath, query: cleanObject({ ...search.watch(), sort: item.value }) }} passHref><Dropdown.Item className={`cursor-pointer ${item.value == search.watch('sort') ? 'bg-soft-primary' : ''}`}>{item.name}</Dropdown.Item></Link>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        ));

        return items;
    })();

    const permitted = (client.user && (client.user.roles.some(role => role == 'manager') || (client.user.roles.some(role => role == 'teacher'))));

    return (
        <>
            <NextSeo title="Courses" />
            <div className="container h-100 py-3">
                <div className="position-relative h-100 pe-none">
                    <div className="d-flex align-items-center py-2">
                        <div className="h3 mb-0">Courses</div>
                    </div>
                    <ScrollMenu
                        LeftArrow={(() => {
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

                            return (<div className={`p-1 mt-n1 cursor-pointer pe-auto ${disabled ? 'invisible' : ''}`} onClick={() => scrollPrev()}><span className="svg-icon svg-icon-xs"><BsChevronLeft /></span></div>);
                        })}

                        RightArrow={() => {
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


                            return (<div className={`p-1 mt-n1 cursor-pointer pe-auto ${disabled ? 'invisible' : ''}`} onClick={() => scrollNext()}><span className="svg-icon svg-icon-xs"><BsChevronRight /></span></div>);
                        }}

                        onWheel={(apiObj, ev) => {
                            const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

                            if (isThouchpad) {
                                ev.stopPropagation();
                                return;
                            }

                            if (ev.deltaY < 0) {
                                apiObj.scrollNext();
                            } else if (ev.deltaY > 0) {
                                apiObj.scrollPrev();
                            }
                        }}

                        wrapperClassName="position-absolute w-100 h-75"
                        scrollContainerClassName="h-100 mx-auto w-100">
                        {scrollItems.map((ScrollItem, scrollItemIndex) => <ScrollItem key={`scroll-item-${scrollItemIndex}`} itemId={`scroll-item-${scrollItemIndex}`} />)}
                    </ScrollMenu>
                    <div className="pe-auto">
                        {(page && page.items.length) ? (
                            <InfiniteScroll
                                className="row g-3 py-6 h-100"
                                dataLength={page.items.length}
                                next={() => load({ ...search.watch(), pageNumber: page.pageNumber + 1 }, true)}
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

                        ) : ((!loading) ?
                            (<>
                                <div className="d-flex flex-column text-center justify-content-center pt-10 mt-10">
                                    <div className="mb-4">
                                        <SvgWebSearchIllus style={{ width: "auto", height: "128px" }} />
                                    </div>
                                    <div className="mb-3">There are no courses here.</div>
                                </div>
                            </>) : (<Loader {...loading} />)
                        )}
                    </div>
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