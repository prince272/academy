import { Spinner } from "react-bootstrap";
import { BsArrowLeft, BsArrowRepeat, BsChevronLeft } from "react-icons/bs";
import { SvgPageNotFoundIllus, SvgOnlinePaymentsIllus, SvgServerDownIllus } from '../resources/images/illustrations';

const Loader = ({ status, message, remount, fallback, ...props }) => {

    let render = <></>;

    if (status) {
        render = (
            <div className="d-flex flex-column text-center justify-content-center">
                <div className="mb-4">
                    {status == 404 ? (<SvgPageNotFoundIllus style={{ width: "auto", height: "160px" }} />) :
                     status == 402 ? (<SvgOnlinePaymentsIllus  style={{ width: "auto", height: "160px" }} />) :
                     (<SvgServerDownIllus style={{ width: "auto", height: "160px" }} />)}

                </div>
                {message && <div className="mb-3">{message}</div>}
                {(fallback || remount) && (
                    <div className="hstack gap-3 mx-auto">
                        {fallback && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fallback}>
                            <span className="svg-icon svg-icon-xs d-inline-block me-1" ><BsArrowLeft /></span><span>Back</span>
                        </button>}
                        {remount && <button type="button" className="btn btn-primary btn-sm" onClick={remount}>
                            <span className="svg-icon svg-icon-xs d-inline-block me-1" ><BsArrowRepeat /></span><span>Reload</span>
                        </button>}
                    </div>
                )}
            </div>
        );
    }
    else {
        render = (
            <div className="d-flex flex-column text-center justify-content-center">
                <div className="mb-3"><Spinner animation="grow" variant="primary" /></div>
                {message && <div>{message}</div>}
            </div>
        );
    }

    return (<div {...props} className={["w-100 h-100", props.className].join(' ')}><div className="d-flex justify-content-center align-items-center px-3 py-10 w-100 h-100">{render}</div></div>)
};

export default Loader;