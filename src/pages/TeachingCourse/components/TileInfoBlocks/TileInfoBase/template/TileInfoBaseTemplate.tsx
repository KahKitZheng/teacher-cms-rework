import { Pencil, Trash } from "lucide-react";
import "./TileInfoBaseTemplate.module.scss";

type TileInfoBaseTemplateProps = {
  children: React.ReactNode;
  title: string;
  actions?: {
    update: {
      enabled: boolean;
      callback: () => void;
    };
    delete: {
      enabled: boolean;
      callback: () => void;
    };
  };
};

export default function TileInfoBaseTemplate(
  props: Readonly<TileInfoBaseTemplateProps>
) {
  const { title, children, actions } = props;

  return (
    <div styleName="tile-info-base">
      <div styleName="header">
        {title && <p styleName="title">{title}</p>}
        <div styleName="actions">
          <button styleName="btn-icon">
            <Pencil size={14} color={"#7890C4"} />
          </button>
          <button styleName="btn-icon">
            <Trash size={14} color={"#7890C4"} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
