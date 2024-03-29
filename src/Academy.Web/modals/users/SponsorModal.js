import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault } from '../../utils/helpers';
import { useClient } from '../../utils/client';
import { sentenceCase } from 'change-case';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';
import Cleave from 'cleave.js/react';
import { ModalPathPrefix } from '..';
import { FaCoffee } from 'react-icons/fa';
import _ from 'lodash';
import { AspectRatio } from 'react-aspect-ratio';
import { SvgOnlineWishesIllus } from '../../resources/images/illustrations';
import { SvgAppWordmark } from '../../resources/images/icons';

const SponsorModal = (props) => {
    const { route, modal } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const userId = route.query.userId;
    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const appSettings = useAppSettings();

    const client = useClient();

    const load = () => {
        Object.entries({
            amount: 0
        }).forEach(([name, value]) => { form.setValue(name, value); });

        if (route.query.status == 'succeeded') {
            modal.close();
        }
    };

    const submit = () => {

        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            let result = await client.post(`/users/${userId}/sponsor`, inputs, { params: { returnUrl: route.url } });

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            router.replace({ pathname: `${ModalPathPrefix}/checkout`, query: { paymentId: result.data } });
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
                    <div><h5><span className="svg-icon svg-icon-sm d-inline-block text-primary me-2"><FaCoffee /></span>Buy Me a Coffee</h5></div>
                    <p>A supporter is worth a 1000 followers.<br />Please consider buying a cup of coffee for me!</p>
                </div>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Suggested amount</label>
                        <div className="d-flex mx-n2">
                            {[5, 20, 100, 200].map(item => {

                                return (
                                    <button type="button" className={`w-100 mx-2 btn ${form.watch('amount') == item ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => form.setValue('amount', item)}>{appSettings.currency.symbol}{item}</button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="col-12">
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
                </div>
            </Modal.Body>
            <Modal.Footer className="pt-0">
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
        size: "sm"
    };
};

export default SponsorModal;