import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AspectRatio } from 'react-aspect-ratio';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { pascalCase } from 'change-case';
import { downloadFromUrl, preventDefault } from '../../utils/helpers';
import { withRemount, useConfetti, withAsync } from '../../utils/hooks';
import Loader from '../../components/Loader';
import ShareButtons from '../../components/ShareButtons';
import { useClient } from '../../utils/client';
import { BsAward, BsDownload } from 'react-icons/bs';
import { DefaultModalProps, useModal } from '../';
import { useEventDispatcher } from '../../utils/eventDispatcher';
import { useDialog } from '../../utils/dialog';
import _ from 'lodash';


const CertificateViewDialog = () => {
    const dialog = useDialog();
    let [course, setCourse] = withAsync(useState(dialog.params.course));
    const courseId = course.id;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const confetti = useConfetti();
    const client = useClient();

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const eventDispatcher = useEventDispatcher();

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);
            let result = await client.post(`/courses/${courseId}/certificate`);

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            course = await setCourse((await client.get(`/courses/${courseId}`, { throwIfError: true })).data.data);
            eventDispatcher.emit(`editCourse`, course);
            confetti.fire();
            setSubmitting(false);
        })();
    };

    return (
        <Modal {...DefaultModalProps} show={dialog.opended} onHide={() => dialog.close()}>
            <Modal.Header closeButton>
                <Modal.Title>{course.title} Certificate</Modal.Title>
            </Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <>
                    <div className="mb-3">
                        <AspectRatio ratio="3/2">
                            {course.certificate ?
                                (<Image className="rounded" priority unoptimized loader={({ src }) => src} src={course.certificate.image.url} layout="fill" objectFit="scale-down" alt={course.title} />) :
                                (
                                    <div className="d-flex justify-content-center align-items-center flex-column bg-light text-muted">
                                        <div className="d-flex justify-content-center align-items-center mb-3"><BsAward style={{ width: "auto", height: "98px" }} /></div>
                                        <div className="h4 text-muted">Certificate</div>
                                    </div>
                                )}
                        </AspectRatio>
                    </div>
                    <div className="text-center">
                        <div className="mb-3">We are happy to present your certificate to you for completing this course.</div>
                        <div>
                            {!course.certificate && (
                                <>
                                    <button type="button" className="btn btn-primary w-100" disabled={submitting} onClick={() => { submit(); }}>
                                        <div className="position-relative d-flex align-items-center justify-content-center">
                                            <div className={`${submitting ? 'invisible' : ''}`}>Get certificate</div>
                                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                        </div>
                                    </button>
                                </>
                            )}
                            {!!course.certificate && (
                                <div className="vstack gap-3">
                                    <button type="button" className="btn btn-primary" onClick={() => { downloadFromUrl(course.certificate.document.url, course.certificate.document.name); }}><span className="svg-icon svg-icon-xs d-inline-block align-text-bottom me-2"><BsDownload /></span>Download certificate</button>
                                    <div className="mb-3 d-flex align-items-center"><div className="me-2 fw-bold">Share:</div><ShareButtons share={{ title: course.title, text: course.description, url: course.certificate.document.url }} /> </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            </Modal.Body>
        </Modal>
    );
};

export default CertificateViewDialog;