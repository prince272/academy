import { useState, useCallback, useEffect, useImperativeHandle } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import { useClient } from '../../utils/client';
import toast from 'react-hot-toast';
import { cleanObject, preventDefault } from '../../utils/helpers';
import { ModalPathPrefix } from '..';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';

const SignInModal = (props) => {
    const { route, modal } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const [provider, setProvider] = useState(route.query.provider || null);
    const returnUrl = route.query.returnUrl;
    const client = useClient();

    const appSettings = useAppSettings();

    useEffect(() => {
        const inputs = JSON.parse(route.query.inputs || null);
        if (inputs != null) {
            form.reset(inputs);
            submit(inputs);
        }
    }, []);

    const submit = (defaultInputs) => {

        form.handleSubmit(async (inputs) => {
            inputs = Object.assign({}, defaultInputs, inputs);

            setSubmitting(true);
            let result = await client.post('/accounts/signin', inputs);

            if (result.error) {
                const error = result.error;

                if (error.details.confirmUsername) {
                    router.replace({ pathname: `${ModalPathPrefix}/accounts/confirm`, query: cleanObject({ returnUrl, provider, inputs: JSON.stringify(inputs) }) });
                }
                else {
                    Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                    toast.error(error.message);
                    setSubmitting(false);
                }

                return;
            }

            await client.signin({ provider: 'username', returnUrl });
            setSubmitting(false);
        })();
    };

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center mb-5">
                    <h4>Sign into account</h4>
                    <p>Don&apos;t have an account yet? <Link href={{ pathname: `${ModalPathPrefix}/accounts/signup`, query: cleanObject({ returnUrl, provider }) }}><a>Sign up here</a></Link></p>
                </div>
                <div className="row g-3">
                    {(provider == 'username') && (
                        <>
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
                                    <Link href={{ pathname: `${ModalPathPrefix}/accounts/password/reset`, query: cleanObject({ returnUrl, provider }) }}><a className="form-label-link">Forgot Password?</a></Link>
                                </div>
                                <input {...form.register("password")} className={`form-control  ${formState.errors.password ? 'is-invalid' : ''}`} type="password" autoComplete={'true'} />
                                <div className="invalid-feedback">{formState.errors.password?.message}</div>
                            </div>
                            <div className="col-12">
                                <button className="btn btn-primary  w-100" type="submit" disabled={submitting}>
                                    <div className="position-relative d-flex align-items-center justify-content-center">
                                        <div className={`${submitting ? 'invisible' : ''}`}>Sign in</div>
                                        {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                    {provider == null && (
                        <>
                            <div className="col-12">
                                <button className="btn btn-primary  w-100" type="button" onClick={() => setProvider('username')}>Sign in with Email or Phone</button>
                            </div>
                        </>
                    )}
                </div>
            </Modal.Body>
        </>
    );
};

export default SignInModal;