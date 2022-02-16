import { useState, useCallback, useEffect, useMemo, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault } from '../../utils/helpers';
import Countdown from 'react-countdown';
import { useClient } from '../../utils/client';

const SignOutModal = (props) => {
    const { route, modal } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const client = useClient();

    const submit = () => {

        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            await client.signout({ returnUrl: router.asPath });

            setSubmitting(false);
        })();
    };

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center mb-5">
                    <h4>Sign out?</h4>
                    <p>Are you sure to want to sign out of your account?</p>
                </div>
                <div className="row g-3">
                    <div className="col-12">
                        <button className="btn btn-primary  w-100" type="submit" disabled={submitting}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${submitting ? 'invisible' : ''}`}>Sign out</div>
                                {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    </div>
                    <div className="col-12">
                        <button className="btn btn-secondary  w-100" type="button" onClick={() => modal.close()}>Cancel</button>
                    </div>
                </div>
            </Modal.Body>
        </>
    );
};

export default SignOutModal;