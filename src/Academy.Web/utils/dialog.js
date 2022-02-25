import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal } from "react-bootstrap";

const ConfirmationDialog = ({ params, opended, close, dispose }) => {

    return (
        <Modal show={opended} onHide={() => close.current()} onExited={() => dispose.current()}>
            <Modal.Header closeButton>
                <Modal.Title>{params.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{params.body}</Modal.Body>
            <Modal.Footer>
                <button className="btn btn-secondary" onClick={() => close.current()} {...params.cancelButtonProps}>Cancel</button>
                <button className="btn btn-primary" style={{ minWidth: "88px" }} onClick={() => close.current(true)} {...params.proceedButtonProps}>Proceed</button>
            </Modal.Footer>
        </Modal>
    );
};

const useDialogProvider = () => {

    const [opended, setOpened] = useState(false);
    const [result, setResult] = useState(null);
    const [params, setParams] = useState(null);
    const [view, setView] = useState({ Component: null });

    const close = useRef(() => {
        throw new Error("Trying to close dialog without opening it.");
    });

    const dispose = useRef(() => {
        setView({ Component: null });
        setParams(null);
    });

    const prepare = useCallback((params, Component) => {
        setOpened(true);
        setResult(null);
        setParams(params);

        setView({ Component: Component });

        return new Promise((resolve) => {
            close.current = (result) => {
                setOpened(false);
                setResult(result);
                resolve(result);
            };
        });
    }, []);

    const Component = ((view.Component && <view.Component {...{ opended, params, close, dispose }} />) || (<></>));

    return {
        Component,
        opended,
        params,
        result,
        open: (params, Component) => prepare(params, Component),
        confirm: (params) => prepare(params, ConfirmationDialog),
        close: close.current,
    };
};

const DialogContext = createContext({});

const DialogProvider = ({ children }) => {

    const value = useDialogProvider();

    return (
        <DialogContext.Provider value={value}>
            {children}
            {value.Component}
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