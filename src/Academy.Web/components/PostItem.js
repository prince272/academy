import _ from 'lodash';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useClient } from '../utils/client';
import { withRemount } from '../utils/hooks';
import Loader from './Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsCalendarDate, BsBookHalf, BsClockFill, BsPersonFill } from 'react-icons/bs';

import ResponsiveEllipsis from 'react-lines-ellipsis/lib/loose';

import { Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../modals';
import { useAppSettings } from '../utils/appSettings';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import { formatNumber } from '../utils/helpers';

const PostItem = ({ post }) => {
    const postId = post.id;
    const appSettings = useAppSettings();
    const client = useClient();
    const permitted = (client.user && (client.user.roles.some(role => role == 'admin') || (client.user.roles.some(role => role == 'teacher') && post.userId == client.user.id)));

    return (
        <div className="card">
            <div className="row g-0">
                <div className="col-4 col-sm-12">
                    <div className="p-1">
                        <AspectRatio ratio="1">
                            {post.image ?
                                (<Image className="rounded border" priority unoptimized loader={({ src }) => src} src={post.image.url} layout="fill" objectFit="cover" alt={post.title} />) :
                                (<div className="rounded border svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center"><BsCardImage /></div>)}
                        </AspectRatio>
                    </div>
                </div>
                <div className="col-8 col-sm-12">
                    <div className="py-1 px-2 h-100 d-flex flex-column position-relative">
                        <div className="hstack gap-3 justify-content-between mb-2">
                            <div className="text-nowrap">
                                <div><span className="text-primary align-text-bottom"><BsCalendarDate /></span> {moment(post.created).format("MMMM D, yyyy")}</div>
                            </div>
                            <div className="text-nowrap">
                                <div><span className="text-primary align-text-bottom"><BsClockFill /></span> {moment.duration(Math.floor(post.duration / 10000)).format("w[w] d[d] h[h] m[m]", { trim: "both", largest: 1 })} read</div>
                            </div>
                        </div>
                        <div className="fs-6 fw-bold mb-2 flex-grow-1" style={{ height: "42px" }}>
                            <ResponsiveEllipsis className="overflow-hidden text-break"
                                text={post.title || ''}
                                maxLine='2'
                                ellipsis='...'
                                trimRight
                                basedOn='letters'
                            />
                        </div>
                        {permitted && (
                            <div className="mb-2"><div className={`badge bg-${post.published ? 'success' : 'warning'} py-1`}>{post.published ? 'Published' : 'Unpublished'}</div></div>
                        )}
                        <div>
                            <div className="d-inline-flex align-items-center my-1 me-2">
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
                        </div>
                        {permitted && (
                            <div className="position-absolute top-0 end-0 zi-2">
                                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                                    {({ ...triggerHandler }) => (
                                        <Dropdown align={'end'}>
                                            <Dropdown.Toggle {...triggerHandler} variant="white" size="sm" bsPrefix=" " className="btn-icon btn-no-focus border-0 m-1">
                                                <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                            </Dropdown.Toggle>

                                            <Dropdown.Menu style={{ margin: 0 }}>
                                                <Link href={`/posts/${postId}`} passHref><Dropdown.Item>View</Dropdown.Item></Link>
                                                <Link href={`${ModalPathPrefix}/posts/${postId}/edit`} passHref><Dropdown.Item>Edit</Dropdown.Item></Link>
                                                <Link href={`${ModalPathPrefix}/posts/${postId}/delete`} passHref><Dropdown.Item>Delete</Dropdown.Item></Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    )}
                                </OverlayTrigger>
                            </div>
                        )}
                    </div>
                </div>
                <Link href={`/posts/${postId}`}><a className="stretched-link" title={post.title}></a></Link>
            </div>
        </div>
    );
}

export default PostItem;