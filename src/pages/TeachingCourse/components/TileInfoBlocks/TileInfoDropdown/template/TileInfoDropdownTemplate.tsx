import { useState } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import Select, { MultiValue } from "react-select";
import "./TileInfoDropdownTemplate.module.scss";

export type TileInfoDropdownTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockDropdown;
  activeBlockId?: number | null;
  hoveredBlockId?: number | null;
};

export default function TileInfoDropdownTemplate(
  props: Readonly<TileInfoDropdownTemplateProps>
) {
  const { tileInfo, activeBlockId, hoveredBlockId } = props;
  const dropdownData = tileInfo;

  const [selectOptions, setSelectOptions] = useState<TileInfoSelectOption[]>(
    []
  );

  function updateSelectedOptions(selected: MultiValue<TileInfoSelectOption>) {
    const updatedSelectOptions: TileInfoSelectOption[] = selected.map(
      (option) => ({ ...option, selected: true })
    );

    setSelectOptions(updatedSelectOptions);
  }

  return (
    <TileInfoBaseTemplate
      title={dropdownData.name}
      blockId={tileInfo.id}
      activeBlockId={activeBlockId}
      hoveredBlockId={hoveredBlockId}
    >
      <Select
        isMulti
        isSearchable
        isClearable={false}
        hideSelectedOptions={false}
        className="react-select-container"
        classNamePrefix="react-select"
        placeholder="Select option(s)" // should be overwritten
        value={selectOptions}
        options={dropdownData.options}
        onChange={updateSelectedOptions}
        closeMenuOnSelect={false}
        // menuIsOpen
        components={{
          MultiValue: MultiValueComponent,
          Option: OptionComponent,
        }}
      />
    </TileInfoBaseTemplate>
  );
}

function MultiValueComponent() {
  return null;
}

function OptionComponent(props: any) {
  return (
    <button styleName="option" onClick={() => props.selectOption(props.data)}>
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => props.selectOption(props.data)}
      />
      <p style={{ textAlign: "left", fontWeight: 400 }}>{props.data.label}</p>
    </button>
  );
}
