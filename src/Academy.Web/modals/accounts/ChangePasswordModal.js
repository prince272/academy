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

const ChangePasswordModal = (props) => {
    const client = useClient();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState({});
    const componentId = useMemo(() => _.uniqueId('Component'), []);
    
    const load = () => {
        form.reset(client.user);
        setLoading(null);
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            let result = await client.post(`/accounts/password/change`, inputs);

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            form.reset();
            toast.success(`Password changed.`, { id: componentId });
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
                    <h4>Change password</h4>
                </div>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Current password</label>
                        <input {...form.register("currentPassword")} type={'password'} className={`form-control  ${formState.errors.currentPassword ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.currentPassword?.message}</div>
                    </div>
                    <div className="col-12">
                        <label className="form-label">New password</label>

                        <input {...form.register("newPassword")} type={'password'} className={`form-control  ${formState.errors.newPassword ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.newPassword?.message}</div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    <button className={`btn btn-primary px-5 w-100 w-sm-auto`} type="button" onClick={() => submit()} disabled={submitting}>
                        <div className="position-relative d-flex align-items-center justify-content-center">
                            <div className={`${submitting ? 'invisible' : ''}`}>Chnage Password</div>
                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                        </div>
                    </button>
                </div>
            </Modal.Footer>
        </>
    );
};

export default ChangePasswordModal;