import { useState, useCallback, useEffect, useMemo, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import ReactPinField from 'react-pin-field';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault } from '../../utils/helpers';
import Countdown from 'react-countdown';
import { useClient } from '../../utils/client';
import { ModalPathPrefix } from '../../modals';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import _ from 'lodash';

const EditProfileModal = (props) => {
    const client = useClient();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState({});
    const componentId = useMemo(() => _.uniqueId('Component'));

    const load = () => {
        form.reset({
            ...client.user,
            avatarId: client.user.avatar?.id
        });
        setLoading(null);
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {
            setSubmitting(true);
            let result = await client.put(`/accounts/profile`, inputs);

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            await client.reloadUser();
            toast.success(`Profile saved.`);
            setSubmitting(false);
        })();
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center mb-5">
                    <h4>Edit profile</h4>
                </div>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Profile picture</label>
                        <FormController name="avatarId" control={form.control}
                            render={({ field }) => {
                                return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={MediaExtensions.IMAGE} layout="circle" />);
                            }} />
                        <div className="invalid-feedback">{formState.errors.avatarId?.message}</div>
                    </div>
                    <div className="col-6">
                        <label className="form-label">First name</label>

                        <input {...form.register("firstName")} className={`form-control  ${formState.errors.firstName ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.firstName?.message}</div>
                    </div>
                    <div className="col-6">
                        <label className="form-label">Last name</label>

                        <input {...form.register("lastName")} className={`form-control  ${formState.errors.lastName ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.lastName?.message}</div>
                    </div>
                    <div className="col-12">
                        <label className="form-label">Bio</label>

                        <textarea {...form.register("bio")} className={`form-control ${formState.errors.bio ? 'is-invalid' : ''}`} rows="4" />
                        <div className="invalid-feedback">{formState.errors.bio?.message}</div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    <button className={`btn btn-primary px-5 w-100 w-sm-auto`} type="button" onClick={() => submit()} disabled={submitting}>
                        <div className="position-relative d-flex align-items-center justify-content-center">
                            <div className={`${submitting ? 'invisible' : ''}`}>Save</div>
                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                        </div>
                    </button>
                </div>
            </Modal.Footer>
        </>
    );
};

export default EditProfileModal;