import { DynamicIcon } from "lucide-react/dynamic";
import Select from "react-select";
// import "./IconPicker.module.scss";

type IconPickerProps = {
  icon: { label: string; value: string };
  icons: { label: string; value: string }[];
};

export default function IconPicker(props: Readonly<IconPickerProps>) {
  const { icon, icons } = props;

  return (
    <Select
      isSearchable={false}
      isClearable={false}
      hideSelectedOptions={false}
      className="react-select-container"
      classNamePrefix="react-select"
      placeholder="Diamond" // should be overwritten
      value={icon}
      options={icons}
      onChange={() => {}}
      closeMenuOnSelect={false}
      components={{
        SingleValue: SingleValueComponent,
        MenuList: MenuListComponent,
        Option: OptionComponent,
      }}
      menuPortalTarget={document.body}
    />
  );
}

function SingleValueComponent(props: any) {
  return (
    <div
      style={{
        width: "32px",
        display: "flex",
        flex: 1,
      }}
    >
      <DynamicIcon
        name={props.data.value}
        size={16}
        fill={props.data.isFilled ? "var(--primary-color)" : "none"}
        color="var(--primary-color)"
        strokeWidth="2px"
      />
    </div>
  );
}

function MenuListComponent(props: any) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 24px)",
        backgroundColor: "white",
        border: "1px solid var(--light-gray)",
        borderRadius: "6px",
        gap: "8px",
        padding: "8px",
        position: "absolute",
        maxHeight: "200px",
        boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
        top: "8px",
        zIndex: 1000,
        overflowY: "auto",
      }}
      {...props.innerProps}
    >
      {props.children}
    </div>
  );
}

function OptionComponent(props: any) {
  return (
    <button
      onClick={() => props.selectOption(props.data)}
      style={{
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "24px",
        width: "24px",
        backgroundColor: "transparent",
      }}
    >
      <DynamicIcon
        name={props.data.value}
        size={16}
        fill={props.data.isFilled ? "var(--primary-color)" : "none"}
        color="var(--primary-color)"
        strokeWidth="2px"
      />
    </button>
  );
}
