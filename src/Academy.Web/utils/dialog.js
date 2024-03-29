import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { DefaultModalProps } from "../modals"
const ConfirmationDialog = () => {
    const dialog = useDialog();
    const { opended, close, params } = dialog;

    return (
        <Modal {...DefaultModalProps} show={opended} onHide={() => close()}>
            <Modal.Header closeButton>
                <Modal.Title>{params.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{params.body}</Modal.Body>
            <Modal.Footer>
                <button className="btn btn-outline-secondary" onClick={() => close()} {...params.cancelButtonProps}>Cancel</button>
                <button className="btn btn-primary" style={{ minWidth: "88px" }} onClick={() => close(true)} {...params.proceedButtonProps}>Proceed</button>
            </Modal.Footer>
        </Modal>
    );
};

const AlertDialog = () => {
    const dialog = useDialog();
    const { opended, close, params } = dialog;

    return (
        <Modal {...DefaultModalProps} show={opended} onHide={() => close()}>
            <Modal.Header closeButton>
                <Modal.Title>{params.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{params.body}</Modal.Body>
            <Modal.Footer>
                <button className="btn btn-primary" style={{ minWidth: "88px" }} onClick={() => close(true)} {...params.proceedButtonProps}>Okay</button>
            </Modal.Footer>
        </Modal>
    );
};

const DialogContext = createContext({});

const DialogProvider = ({ children }) => {

    const [opended, setOpened] = useState(false);
    const [params, setParams] = useState(null);
    const [view, setView] = useState({ Component: null });

    const close = useRef(() => {
        throw new Error("Trying to close dialog without opening it.");
    });

    const prepare = useCallback((params, Component) => {
        setOpened(true);
        setParams(params);
        setView({ Component: Component });

        return new Promise((resolve) => {
            close.current = (result) => {
                setView({ Component: null });
                setParams(null);
                setOpened(false);

                resolve(result);
                close.current = () => { throw new Error("Trying to close dialog without opening it."); };
            };
        });
    }, []);

    return (
        <DialogContext.Provider value={{
            opended,
            params,
            open: (params, Component) => prepare(params, Component),
            confirm: (params) => prepare(params, ConfirmationDialog),
            alert: (params) => prepare(params, AlertDialog),
            close: (...args) => close.current(...args),
        }}>
            {children}
            {((view.Component && <view.Component />) || (<></>))}
        </DialogContext.Provider>
    )
};

const DialogConsumer = ({ children }) => {
    return (
        <DialogContext.Consumer>
            {context => {
                if (context === undefined) {
                    throw new Error('DialogConsumer must be used within a DialogProvider.')
                }
                return children(context)
            }}
        </DialogContext.Consumer>
    )
};

const useDialog = () => {
    return useContext(DialogContext);
};

export { DialogProvider, DialogConsumer, useDialog };