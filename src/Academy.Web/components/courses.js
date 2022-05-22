import _ from 'lodash';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useClient } from '../utils/client';
import { withRemount } from '../utils/hooks';
import Loader from '../components/Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsPlus, BsBookHalf, BsClockFill, BsPersonFill } from 'react-icons/bs';

import ResponsiveEllipsis from 'react-lines-ellipsis/lib/loose';

import { Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../modals';
import { useAppSettings } from '../utils/appSettings';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import { formatNumber } from '../utils/helpers';

const CourseItem = ({ course }) => {
    const courseId = course.id;
    const appSettings = useAppSettings();
    const client = useClient();
    const permitted = (client.user && (client.user.roles.some(role => role == 'admin') || (client.user.roles.some(role => role == 'teacher') && course.userId == client.user.id)));

    return (
        <div className="card position-relative">
            <div className="row g-0">
                <div className="col-4 col-sm-12">
                    <div className="p-1">
                        <AspectRatio ratio="1">
                            {course.image ?
                                (<Image className="rounded border" priority unoptimized loader={({ src }) => src} src={course.image.url} layout="fill" objectFit="cover" alt={course.title} />) :
                                (<div className="rounded border svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center"><BsCardImage /></div>)}
                        </AspectRatio>
                    </div>
                </div>
                <div className="col-8 col-sm-12">
                    <div className="py-1 px-2 h-100 d-flex flex-column">
                        <div className="fs-6 fw-bold mb-2 flex-grow-1" style={{ height: "42px" }}>
                            <ResponsiveEllipsis className="overflow-hidden text-break"
                                text={course.title || ''}
                                maxLine='2'
                                ellipsis='...'
                                trimRight
                                basedOn='letters'
                            />
                        </div>
                        {permitted && (
                            <div className="mb-2"><div className={`badge bg-${course.published ? 'success' : 'warning'} py-1`}>{course.published ? 'Published' : 'Unpublished'}</div></div>
                        )}
                        <div className="text-primary">{course.price > 0 ? (<span className="text-nowrap"><span>{appSettings.currency.symbol}</span> {course.price}</span>) : (<span>Free</span>)}</div>
                        <div className="hstack gap-3 justify-content-between">
                            <div className="d-inline-flex align-items-center my-1 me-2">
                                {(() => {
                                    const teacher = (client.user && client.user.id == course.teacher.id) ? client.user : course.teacher;
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
                            <div className="hstack text-nowrap">
                                <div><span className="text-primary"><BsClockFill /></span> {moment.duration(Math.floor(course.duration / 10000)).format("w[w] d[d] h[h] m[m]", { trim: "both", largest: 1 })}</div>
                                <span className="mx-2">·</span>
                                <div><span className="text-primary"><BsPersonFill /></span> {formatNumber(course.students)}</div>
                            </div>
                        </div>
                        {permitted && (
                            <div className="position-absolute top-0 end-0 zi-2">
                                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                                    {({ ...triggerHandler }) => (
                                        <Dropdown align={'end'}>
                                            <Dropdown.Toggle {...triggerHandler} variant="outline-secondary" size="sm" bsPrefix=" " className="btn-icon btn-no-focus border-0 m-1">
                                                <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                            </Dropdown.Toggle>

                                            <Dropdown.Menu style={{ margin: 0 }}>
                                                <Link href={`/courses/${courseId}`} passHref><Dropdown.Item>View</Dropdown.Item></Link>
                                                <Link href={`${ModalPathPrefix}/courses/${courseId}/edit`} passHref><Dropdown.Item>Edit</Dropdown.Item></Link>
                                                <Link href={`${ModalPathPrefix}/courses/${courseId}/delete`} passHref><Dropdown.Item>Delete</Dropdown.Item></Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    )}
                                </OverlayTrigger>
                            </div>
                        )}
                    </div>
                </div>
                <Link href={`/courses/${courseId}`}><a className="stretched-link" title={course.title}></a></Link>
            </div>
        </div>
    );
}

export { CourseItem };