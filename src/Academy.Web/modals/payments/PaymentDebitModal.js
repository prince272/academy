import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Form, Modal, Accordion, useAccordionButton, AccordionContext, Collapse } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault, sleep } from '../../utils/helpers';
import { useClient } from '../../utils/client';
import { noCase, sentenceCase } from 'change-case';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';
import Cleave from 'cleave.js/react';
import { AspectRatio } from 'react-aspect-ratio';
import Loader from '../../components/Loader';
import { withRemount } from '../../utils/hooks';
import { BsCheckCircleFill, BsXCircleFill } from 'react-icons/bs';

const PaymentProcessModal = withRemount((props) => {
    const { route, modal, remount } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const appSettings = useAppSettings();
    const paymentId = route.query.paymentId;
    const [payment, setPayment] = useState(null);

    if (!route.query.returnUrl) throw new Error(`The query param 'returnUrl' was not found. url: ${route.url}`);

    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const client = useClient();

    const load = async () => {
        setLoading({});

        let result = await client.get(`/payments/${paymentId}`);

        if (result.error) {
            const error = result.error;

            setLoading({ ...error, message: 'Unable to process payment.', remount });
            return;
        }

        const payment = result.data;
        setPayment(payment);

        if (payment.status == 'processing') {
            checkPayment();
        }
        else {
            form.setValue('issuerType', '');

            const returnURL = new URL(route.url);
            returnURL.searchParams.set('returnUrl', route.query.returnUrl);
            form.setValue('returnUrl', returnURL.href);
        }

        setLoading(null);
    };

    const submit = () => {

        form.handleSubmit(async (inputs) => {

            setSubmitting(true);
            let result = await client.post(`/payments/${paymentId}/process`, inputs);
            setSubmitting(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                return;
            }

            const payment = result.data;
            setPayment(payment);

            checkPayment();

            if (payment.checkoutUrl) {
                router.replace(payment.checkoutUrl);
            }
        })();
    };

    const checkPayment = async () => {

        for (let count = 0; count < 120; count++) {
            const result = await client.get(`/payments/${paymentId}`);

            if (!result.error) {
                const payment = result.data;
                setPayment(payment);
                if (payment.status != 'processing') break;
            }

            await sleep(5000);
        }
    };

    useEffect(load, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title as="h5">Payment {payment.status == 'pending' ? 'options' : noCase(payment.status)}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" as={Form} onSubmit={preventDefault(() => submit())}>
                {payment.status == 'pending' && (
                    <div>
                        <div className="list-group list-group-flush py-5">
                            <div className="list-group-item p-0">
                                <div className="px-4">
                                    <div className="form-check mb-0 py-3" onClick={() => form.setValue('issuerType', 'mobile')}>
                                        <input type="radio" className="form-check-input" name="formRadio" checked={form.watch('issuerType') == 'mobile'} />
                                        <label className="form-check-label">Pay with <span className="fw-bold">Mobile Money</span></label>
                                    </div>
                                </div>
                                <Collapse in={form.watch('issuerType') == 'mobile'}>
                                    <div>
                                        <div className="px-4 py-3">
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label">Mobile number</label>
                                                    <FormController name="mobileNumber" control={form.control} render={({ field }) => {
                                                        return (<PhoneInput value={field.value} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.mobileNumber ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
                                                    }} />
                                                    <div className="invalid-feedback">{formState.errors.mobileNumber?.message}</div>
                                                </div>
                                                <div className="col-12">

                                                    <button className="btn btn-primary w-100" type="button" onClick={() => submit()} disabled={submitting}>
                                                        <div className="position-relative d-flex align-items-center justify-content-center">
                                                            <div className={`${submitting ? 'invisible' : ''}`}>Pay <span>{appSettings.currency.symbol}{payment.amount}</span></div>
                                                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                            <div className="list-group-item p-0">
                                <div className="px-4">
                                    <div className="form-check mb-0 py-3" onClick={() => form.setValue('issuerType', null)}>
                                        <input type="radio" className="form-check-input" name="formRadio" checked={form.watch('issuerType') == null} />
                                        <label className="form-check-label">Pay with <span className="fw-bold">PaySwitch</span></label>
                                    </div>
                                </div>
                                <Collapse in={form.watch('issuerType') == null}>
                                    <div>
                                        <div className="px-4 py-3">
                                            <button className="btn btn-primary w-100" type="button" onClick={() => submit()} disabled={submitting}>
                                                <div className="position-relative d-flex align-items-center justify-content-center">
                                                    <div className={`${submitting ? 'invisible' : ''}`}>Pay <span>{appSettings.currency.symbol}{payment.amount}</span></div>
                                                    {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                        </div>
                    </div>
                )}
                {payment.status == 'processing' && (
                    <div>
                        <Loader message={({
                            'mobile': <span><span className="fw-bold">Heads-up!</span> You'll receive a prompt on your mobile device to authorize this payment. If the prompt delays, check your approvals list to complete the payment.</span>,
                        })[form.watch('issuerType')] || <span>You may be redirected to third party payment provider to continue the payment process.</span>} />
                    </div>
                )}
                {payment.status == 'failed' && (
                    <div>
                        <div className="d-flex flex-column text-center justify-content-center py-8 px-4">
                            <div className="mb-3 px-10"><span className="svg-icon svg-icon-lg text-danger"><BsXCircleFill /></span></div>
                            <div className="h3">Payment failed</div>
                            <div className="mb-3">Something went wrong while processing your payment.</div>
                            <Link href={route.query.returnUrl}><a className="btn btn-danger">Return</a></Link>
                        </div>
                    </div>
                )}
                {payment.status == 'complete' && (
                    <div>
                        <div className="d-flex flex-column text-center justify-content-center py-8 px-4">
                            <div className="mb-3 px-10"><span className="svg-icon svg-icon-lg text-success"><BsCheckCircleFill /></span></div>
                            <div className="h3">Payment Complete</div>
                            <div className="mb-3">Thank you for your payment.</div>
                            <Link href={route.query.returnUrl}><a className="btn btn-success">Continue</a></Link>
                        </div>
                    </div>
                )}
            </Modal.Body>
            {(payment.status == 'pending' || payment.status == 'processing') &&
                (
                    <Modal.Footer className="d-block text-center py-sm-5">
                        <small className="text-cap mb-4">We accept all payments through</small>

                        <div className="w-85 mx-auto">
                            <AspectRatio ratio="512/52">
                                <Image src="/img/img3.png" layout="fill" className="image" />
                            </AspectRatio>
                        </div>
                    </Modal.Footer>
                )
            }
        </>
    );
});

PaymentProcessModal.getModalProps = () => {
    return {
        size: 'sm'
    };
};

export default PaymentProcessModal;