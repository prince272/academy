import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault } from '../utils/helpers';
import { useClient } from '../utils/client';
import { sentenceCase } from 'change-case';
import PhoneInput from '../components/PhoneInput';
import { useAppSettings } from '../utils/appSettings';
import _ from 'lodash';

const ContactModal = (props) => {
    const { route, modal } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const appSettings = useAppSettings();

    const client = useClient();

    const load = () => {
    };

    const submit = () => {

        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            let result = await client.post('/contact', inputs);

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            toast.success('We\'ll get back to you shortly. Thank you!', { id: componentId });
            modal.close();
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
                    <h4>Get in touch</h4>
                    <p>Please fill out the form and we'll get back to you shortly.</p>
                </div>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Full name</label>
                        <input {...form.register("fullName")} className={`form-control  ${formState.errors.fullName ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.fullName?.message}</div>
                    </div>
                    <div className="col-12 col-sm-7">
                        <label className="form-label">Email</label>
                        <input {...form.register("email")} className={`form-control  ${formState.errors.email ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.email?.message}</div>
                    </div>
                    <div className="col-12 col-sm-5">
                        <label className="form-label">Phone number</label>
                        <FormController name="phoneNumber" control={form.control} render={({ field }) => {
                            return (<PhoneInput value={field.value} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.phoneNumber ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
                        }} />
                        <div className="invalid-feedback">{formState.errors.phoneNumber?.message}</div>
                    </div>
                    <div className="col-12">
                        <label className="form-label">Message</label>
                        <textarea {...form.register("message")} className={`form-control ${formState.errors.message ? 'is-invalid' : ''}`} rows="4" placeholder={`Say something nice...`} />
                        <div className="invalid-feedback">{formState.errors.message?.message}</div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-primary px-10 w-100 w-sm-auto" type="button" disabled={submitting} onClick={() => submit()}>
                    <div className="position-relative d-flex align-items-center justify-content-center">
                        <div className={`${submitting ? 'invisible' : ''}`}>Submit</div>
                        {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                    </div>
                </button>
            </Modal.Footer>
        </>
    );
};

export default ContactModal;