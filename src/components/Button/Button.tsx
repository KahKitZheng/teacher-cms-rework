import "./Button.module.scss";

type ButtonProps = {
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function Button(props: Readonly<ButtonProps>) {
  const { onClick, children } = props;

  return (
    <button styleName="button" onClick={onClick} style={props.style}>
      {children}
    </button>
  );
}
