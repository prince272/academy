import 'react-phone-number-input/style.css';
import ReactPhoneInput from 'react-phone-number-input';
import { useRef, forwardRef, createContext, useContext } from 'react';
import { setRefs } from '../utils/hooks';

function isNullOrWhitespace(input) {
  return (typeof input === 'undefined' || input == null)
    || input.replace(/\s/g, '').length < 1;
}
const isPhone = (value) => { if (isNullOrWhitespace(value)) return false; return new RegExp("^[-+0-9() ]+$").test(value || '') }

const PhoneInputPropsContext = createContext();
const PhoneInputPropsWrapper = ({ children, props }) => {

  return (
    <PhoneInputPropsContext.Provider value={props}>
      {children}
    </PhoneInputPropsContext.Provider>
  );
};

const usePhoneInputProps = () => {
  return useContext(PhoneInputPropsContext);
};

const InputComponent = forwardRef((forwardProps, forwardRef) => {
  const { className, value, onChange, disabled } = usePhoneInputProps();
  const inputRef = useRef();

  return (
    <>

      <input value={isPhone(value) ? forwardProps.value : value}
        onChange={(e) => {

          const targetValue = e.target.value;

          if (isPhone(targetValue)) {
            forwardProps.onChange(e);
          }
          else
            onChange(targetValue);
        }}
        ref={setRefs(forwardRef, inputRef)} {...{ className: `${forwardProps.className} ${className}`, type: "text", disabled }} />
    </>
  );
});
InputComponent.displayName = "InputComponent";

const PhoneInputControl = () => {
  const { className, value, onChange, disabled, ...rest } = usePhoneInputProps();

  return (
    <div>
      <ReactPhoneInput
        addInternationalOption={false}
        international={false}
        withCountryCallingCode={false}
        value={isPhone(value) ? value : undefined}
        onChange={onChange}
        disabled={disabled}
        inputComponent={InputComponent}
        {...rest}
      />
      <style jsx>
        {`
          div > :global(.PhoneInput .PhoneInputCountry) {
            display: ${isPhone(value) ? 'flex' : 'none'} !important;
            order: 1;
            margin-left: -50px;
            margin-right: 16px;
          }
          div > :global(.PhoneInput .PhoneInputCountry .PhoneInputCountrySelect) {
            opacity: 0;
          }
          div > :global(.PhoneInput input) {
            padding-right: ${isPhone(value) ? '60px' : '0px'};
          }

         `}
      </style>
    </div>
  );
};

const PhoneInput = (props) => {

  return (
    <PhoneInputPropsWrapper props={props}>
      <PhoneInputControl />
    </PhoneInputPropsWrapper>
  );
};

export default PhoneInput;