import _ from 'lodash';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useClient } from '../../utils/client';
import { withRemount } from '../../utils/hooks';
import Loader from '../../components/Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsPlus, BsBookHalf } from 'react-icons/bs';
import TruncateMarkup from 'react-truncate-markup';
import { Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../../modals';
import { CourseItem } from '../../components/courses';

const CoursesPage = withRemount((props) => {
    const { remount } = props;
    const modal = useModal();
    const [loading, setLoading] = useState({});
    const [page, setPage] = useState(null);
    const client = useClient();

    const preparePage = async () => {
        setLoading({});

        let result = await client.get(`/courses`);

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load courses.', remount });
            return;
        }

        setPage(result.data);
        setLoading(null);
    };

    useEffect(() => {
        preparePage();
    }, []);

    useEffect(() => {

        const crud = (source, path, item, action) => {
            source = _.cloneDeep(source);
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

        modal.events.on('addCourse', handleAddCourse);
        modal.events.on('editCourse', handleEditCourse);
        modal.events.on('deleteCourse', handleDeleteCourse);

        return () => {
            modal.events.off('addCourse', handleAddCourse);
            modal.events.off('editCourse', handleEditCourse);
            modal.events.off('deleteCourse', handleDeleteCourse);
        }
    }, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <div className="container py-3">
                <div className="row g-3">
                    {page.items.map((course, courseindex) => {
                        return (
                            <div key={course.id} className="col-6 col-md-4 col-lg-3">
                                <CourseItem course={course} />
                            </div>
                        );
                    })}
                </div>
            </div>
            {client.user && client.user.roles.some(role => role == 'teacher') &&
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