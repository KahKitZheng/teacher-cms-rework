import { useState } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import Select, { MultiValue } from "react-select";
import "./TileInfoDropdownTemplate.module.scss";

export type TileInfoDropdownTemplateProps = {
  variant: "template" | "edit" | "read";
  tileInfo: TileInfoBlockDropdown;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column"; // Hierarchy level for collision detection
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

export default function TileInfoDropdownTemplate(
  props: Readonly<TileInfoDropdownTemplateProps>
) {
  const {
    tileInfo,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onAddElement,
    onEditElement,
    onDeleteElement,
    isPreview,
  } = props;
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
      activeId={activeId}
      hoveredBlockId={hoveredBlockId}
      isDragOverlay={isDragOverlay}
      level={level}
      isPreview={isPreview}
      actions={{
        // add: onAddElement,
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <Select
        isMulti
        isSearchable
        isClearable={false}
        isDisabled={isPreview}
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
