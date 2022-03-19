import { useState, useCallback, useEffect, useMemo, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { pascalCase } from 'change-case';
import { preventDefault } from '../../utils/helpers';

import Cleave from 'cleave.js/react';

import Loader from '../../components/Loader';
import { useClient } from '../../utils/client';
import { withRemount } from '../../utils/hooks';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import { BsInfoCircle } from 'react-icons/bs';
import { useAppSettings } from '../../utils/appSettings';
import { useEventDispatcher } from '../../utils/eventDispatcher';
import _ from 'lodash';

const CourseEditModal = withRemount((props) => {
    const { route, modal, remount, updateModalProps } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [action, setAction] = useState(route.query.action);
    const courseId = route.query.courseId;

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const eventDispatcher = useEventDispatcher();
    const appSettings = useAppSettings();
    const client = useClient();

    const load = async () => {
        if (action == 'edit') {

            setLoading({});

            let result = await client.get(`/courses/${courseId}`);

            if (result.error) {
                const error = result.error;

                setLoading({ ...error, message: 'Unable to load course.', fallback: modal.close, remount });
                return;
            }

            form.reset({
                ...result.data,
                imageId: result.data.image?.id,
                certificateTemplateId: result.data.certificateTemplate?.id,
            });
            setLoading(null);
        }
        else {
            form.reset({ cost: 0 });
            setLoading(null);
        }
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await ({
                'add': () => client.post(`/courses`, inputs),
                'edit': () => client.put(`/courses/${courseId}`, inputs),
                'delete': () => client.delete(`/courses/${courseId}`)
            })[action]();

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            if (action == 'add' || action == 'edit') {
                eventDispatcher.emit(`${action}Course`, (await client.get(`/courses/${result.data || courseId}`, { throwIfError: true })).data.data);
            }
            else if (action == 'delete') {
                eventDispatcher.emit(`${action}Course`, { id: courseId });
            }

            toast.success(`Course ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`, { id: componentId });
            modal.close();
        })();
    };

    useEffect(() => {
        if (action == 'delete') {
            updateModalProps({ size: 'md', contentClassName: '' });
        }
        else {
            updateModalProps(CourseEditModal.getModalProps());
        }

    }, [action]);

    useEffect(() => {
        load();
    }, []);


    if (loading) return (<Loader {...loading} />);

    const courseCost = parseFloat(`${form.watch("cost")}`.replace(/,/g, '')) || 0;
    const coursePrice = ((appSettings.course.rate * courseCost) + courseCost).toFixed(2) * 1;

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>{pascalCase(action)} course</Modal.Title>
            </Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <>
                    <div className={`row g-3 ${action == 'delete' ? 'd-none' : ''}`}>
                        <div className="col-12">
                            <label className="form-label">Title</label>
                            <input {...form.register("title")} className={`form-control  ${formState.errors.title ? 'is-invalid' : ''}`} />
                            <div className="invalid-feedback">{formState.errors.title?.message}</div>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label">Subject</label>
                            <select {...form.register("subject")} className={`form-select  ${formState.errors.subject ? 'is-invalid' : ''}`}>
                                {appSettings.course.subjects.map((subject) => (
                                    <option key={subject.value} value={subject.value}>{subject.name}</option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{formState.errors.subject?.message}</div>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label">State</label>
                            <select {...form.register("state")} className={`form-select  ${formState.errors.state ? 'is-invalid' : ''}`}>
                                {[
                                    { value: 'hidden', name: 'Hidden' },
                                    { value: 'visible', name: 'Visible' },
                                    ...(client.user.roles.some(role => role == 'admin') ? [{ value: 'rejected', name: 'Rejected' }] : [])
                                ].map((state) => (
                                    <option key={state.value} value={state.value}>{state.name}</option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{formState.errors.state?.message}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Description</label>
                            <textarea {...form.register("description")} className={`form-control  ${formState.errors.description ? 'is-invalid' : ''}`} rows="4" />
                            <div className="invalid-feedback">{formState.errors.description?.message}</div>
                        </div>
                        <div className="col-7">
                            <label className="form-label">Cost
                                <OverlayTrigger trigger="hover" rootClose placement="top" overlay={(popoverProps) => (
                                    <Popover {...popoverProps} arrowProps={{ style: { display: "none" } }}>
                                        <Popover.Body className="p-3">
                                            <div className="small">The expense incurred for making this course.</div>
                                        </Popover.Body>
                                    </Popover>

                                )}>
                                    <span className="link-primary svg-icon svg-icon-xs d-inline-block mx-1"><BsInfoCircle /></span>
                                </OverlayTrigger>
                                (<span>{courseCost > 0 ? 'paid' : 'free'}</span> course)
                            </label>
                            <div className="input-group input-group-merge">
                                <div className="input-group-prepend input-group-text">{appSettings.currency.symbol}</div>
                                <FormController name="cost" control={form.control}
                                    render={({ field }) => {
                                        return (
                                            <Cleave value={field.value}
                                                options={{ numeral: true, numeralThousandsGroupStyle: "thousand" }}
                                                onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.cost ? 'is-invalid' : ''}`} />
                                        );
                                    }} />
                            </div>
                            <div className="invalid-feedback">{formState.errors.cost?.message}</div>
                            <input {...form.register("cost")} type="hidden" />
                        </div>
                        <div className="col-5">
                            <label className="form-label">Price</label>
                            <input type="text" className="form-control-plaintext" value={coursePrice} readOnly />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Image</label>
                            <FormController name="imageId" control={form.control}
                                render={({ field }) => {
                                    return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={MediaExtensions.IMAGE} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.imageId?.message}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Certificate template</label>
                            <FormController name="certificateTemplateId" control={form.control}
                                render={({ field }) => {
                                    return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={'.doc, .docx'} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.certificateTemplateId?.message}</div>
                        </div>
                    </div>
                    {action == 'delete' && <p className="mb-0">Are you sure you want to {action} this course?</p>}
                </>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    {(action == 'edit') && <button type="button" className="btn btn-danger me-auto" onClick={() => setAction('delete')}>Delete</button>}
                    <button type="button" className="btn btn-secondary" onClick={() => { modal.close(); }}>Cancel</button>

                    <button className={`btn btn-${action == 'delete' ? 'danger' : 'primary'}`} type="button" onClick={() => submit()} disabled={submitting}>
                        <div className="position-relative d-flex align-items-center justify-content-center">
                            <div className={`${submitting ? 'invisible' : ''}`}>{action == 'delete' ? 'Delete' : 'Save'}</div>
                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                        </div>
                    </button>
                </div>
            </Modal.Footer>
        </>
    );
});


CourseEditModal.getModalProps = () => {
    return {
        contentClassName: 'h-100',
        size: 'lg',
    };
};

export default CourseEditModal;