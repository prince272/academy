import _ from 'lodash';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useClient } from '../utils/client';
import { withRemount } from '../utils/hooks';
import Loader from '../components/Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsPlus, BsBookHalf, BsClockFill } from 'react-icons/bs';
import TruncateMarkup from 'react-truncate-markup';
import { Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../modals';
import { useSettings } from '../utils/settings';

import * as moment from 'moment';

const CourseItem = ({ course }) => {
    const settings = useSettings();
    const client = useClient();
    const editable = (client.user && ((client.user.roles.some(role => role == 'teacher') && client.user.id == course.user.id) || client.user.roles.some(role => role == 'manager')));

    return (
        <div className="card shadow-sm">
            <div className="card-img-top pt-2 px-2">
                <AspectRatio ratio="3/2">
                    {course.image ?
                        (<Image className="rounded" priority unoptimized loader={({ src }) => src} src={course.image.url} layout="fill" objectFit="cover" alt={course.title} />) :
                        (<div className="rounded svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center"><BsCardImage /></div>)}
                </AspectRatio>
            </div>
            <div className="card-body p-2 position-relative">
                <div className="d-inline-block badge text-dark bg-soft-primary mb-2">{settings.courseSubjects.find(subject => course.subject == subject.value)?.name}</div>
                <div className="fs-6 mb-2" style={{ height: "48px" }}>
                    <TruncateMarkup lines={2}><div>{course.title}</div></TruncateMarkup>
                </div>
                <div className="d-flex small mb-2">
                    <div><span className="text-primary"><BsClockFill /></span> {moment.duration(Math.floor(course.duration / 10000)).humanize()}</div>
                </div>
                {editable && (
                    <div className="position-absolute top-0 end-0 zi-2">
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                            {({ ...triggerHandler }) => (
                                <Dropdown align={'end'}>
                                    <Dropdown.Toggle {...triggerHandler} variant="outline-secondary" size="sm" bsPrefix=" " className="btn-icon btn-no-focus rounded-pill border-0 m-1">
                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu style={{ margin: 0 }}>
                                        <Link href={`/courses/${course.id}`} passHref><Dropdown.Item>View</Dropdown.Item></Link>
                                        <Link href={`${ModalPathPrefix}/courses/${course.id}/edit`} passHref><Dropdown.Item>Edit</Dropdown.Item></Link>
                                        <Link href={`${ModalPathPrefix}/courses/${course.id}/delete`} passHref><Dropdown.Item>Delete</Dropdown.Item></Link>

                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </OverlayTrigger>
                    </div>
                )}
            </div>
            <Link href={`/courses/${course.id}`}><a className="stretched-link" title={course.title}></a></Link>
        </div>
    );
}

export { CourseItem };