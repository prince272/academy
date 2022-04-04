import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault } from '../../utils/helpers';
import { useClient } from '../../utils/client';
import { ModalPathPrefix } from '..';
import { noCase, sentenceCase } from 'change-case';
import _ from 'lodash';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';

const SignUpModal = (props) => {
    const { route, modal } = props;
    const router = useRouter();
    const form = useForm({});
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const [provider, setProvider] = useState(route.query.provider || null);
    const returnUrl = route.query.returnUrl;
    const client = useClient();

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const appSettings = useAppSettings();

    const submit = () => {

        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            let result = await client.post('/accounts/signup', inputs);

            if (result.error && result.error.reason != 'duplicateUsername') {

                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            router.replace({ pathname: `${ModalPathPrefix}/accounts/signin`, query: cleanObject({ returnUrl, provider, inputs: JSON.stringify({ username: inputs.username, password: inputs.password }) }) });
        })();
    };

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center mb-5">
                    <h4>Create an account</h4>
                    <p>Already have an account? <Link href={{ pathname: `${ModalPathPrefix}/accounts/signin`, query: cleanObject({ returnUrl, provider }) }}><a>Sign in here</a></Link></p>
                </div>
                <div className="row g-3">
                    {(provider == 'username') && (
                        <>
                            <div className="col-sm-6">
                                <label className="form-label">First name</label>
                                <input {...form.register("firstName")} className={`form-control  ${formState.errors.firstName ? 'is-invalid' : ''}`} />
                                <div className="invalid-feedback">{formState.errors.firstName?.message}</div>
                            </div>
                            <div className="col-sm-6">
                                <label className="form-label">Last name</label>
                                <input {...form.register("lastName")} className={`form-control  ${formState.errors.lastName ? 'is-invalid' : ''}`} />
                                <div className="invalid-feedback">{formState.errors.lastName?.message}</div>
                            </div>
                            <div className="col-12">
                                <label className="form-label">Email or phone number</label>
                                <FormController name="username" control={form.control} render={({ field }) => {
                                    return (<PhoneInput value={field.value} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.username ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
                                }} />
                                <div className="invalid-feedback">{formState.errors.username?.message}</div>
                            </div>
                            <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center">
                                    <label className="form-label">Password</label>
                                </div>
                                <input {...form.register("password")} className={`form-control  ${formState.errors.password ? 'is-invalid' : ''}`} type="password" />
                                <div className="invalid-feedback">{formState.errors.password?.message}</div>
                            </div>
                            <div className="col-12">
                                <button className="btn btn-primary  w-100" type="submit" disabled={submitting}>
                                    <div className="position-relative d-flex align-items-center justify-content-center">
                                        <div className={`${submitting ? 'invisible' : ''}`}>Sign up</div>
                                        {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                    {provider == null && (
                        <div className="col-12">
                            <button className="btn btn-primary  w-100" type="button" onClick={() => setProvider('username')}>Sign up with Email or Phone</button>
                        </div>
                    )}
                    <div className="col-12 mt-3 d-flex justify-content-center text-center mt-3">
                        <p className="small mb-0">By continuing you agree to our <Link href="/terms"><a>Terms and Conditions</a></Link></p>
                    </div>
                </div>
            </Modal.Body>
        </>
    );
};

export default SignUpModal;