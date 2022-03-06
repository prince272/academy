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
import Cleave from 'cleave.js/react';
import { ModalPathPrefix } from './';
import { BsHeartFill } from 'react-icons/bs';
import _ from 'lodash';

const SponsorModal = (props) => {
    const { route, modal } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);

    const componentId = useMemo(() => _.uniqueId('Component'));
    const appSettings = useAppSettings();

    const client = useClient();

    const load = () => {
        Object.entries({
            amount: 0
        }).forEach(([name, value]) => { form.setValue(name, value); });
    };

    const submit = () => {

        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            let result = await client.post('/sponsor', inputs);

            if (result.error) {               
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            const paymentId = result.data.paymentId;
            router.replace({ pathname: `${ModalPathPrefix}/cashin/${paymentId}`, query: { returnUrl: route.url } });
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
                    <h5><span className="svg-icon svg-icon-sm d-inline-block text-danger me-2 heart"><BsHeartFill /></span>Sponsor</h5>
                    <p>If you think Academy of Ours is valuable to you, Sponsor!</p>
                </div>
                <div className="row g-3">
                    <div className="col-12 col-sm-5">
                        <label className="form-label">Amount</label>
                        <div className="input-group input-group-merge">
                            <div className="input-group-prepend input-group-text">{appSettings.currency.symbol}</div>
                            <FormController name="amount" control={form.control}
                                render={({ field }) => {
                                    return (
                                        <Cleave value={field.value}
                                            options={{ numeral: true, numeralThousandsGroupStyle: "thousand" }}
                                            onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.amount ? 'is-invalid' : ''}`} />
                                    );
                                }} />
                        </div>
                        <div className="invalid-feedback">{formState.errors.amount?.message}</div>
                    </div>
                    <div className="col-12 col-sm-7">
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
                        <textarea {...form.register("message")} className={`form-control ${formState.errors.message ? 'is-invalid' : ''}`} rows="3" placeholder={`Say something nice...`} />
                        <div className="invalid-feedback">{formState.errors.message?.message}</div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-primary px-10 w-100" type="button" disabled={submitting} onClick={() => submit()}>
                    <div className="position-relative d-flex align-items-center justify-content-center">
                        <div className={`${submitting ? 'invisible' : ''}`}>Proceed</div>
                        {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                    </div>
                </button>
            </Modal.Footer>
        </>
    );
};


SponsorModal.getModalProps = () => {
    return {

    };
};

export default SponsorModal;