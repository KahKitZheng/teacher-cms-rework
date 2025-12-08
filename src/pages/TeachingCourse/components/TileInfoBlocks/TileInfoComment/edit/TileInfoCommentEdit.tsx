import { Info, AlertTriangle, AlertCircle } from "lucide-react";
import TipTapEditor from "../../../shared/TipTapEditor";
import "./TileInfoCommentEdit.module.scss";

export type TileInfoCommentEditProps = {
  variant: "edit";
  tileInfo: TileInfoBlockComment;
};

const commentTypeConfig = {
  info: { icon: Info, color: "#60a5fa" },
  warning: { icon: AlertTriangle, color: "#fb923c" },
  error: { icon: AlertCircle, color: "#f87171" },
};

export default function TileInfoCommentEdit(
  props: Readonly<TileInfoCommentEditProps>
) {
  const { tileInfo } = props;
  const config = commentTypeConfig[tileInfo.commentType];
  const Icon = config.icon;

  return (
    <div
      styleName="comment-edit"
      style={{ borderLeftColor: config.color }}
    >
      <div styleName="comment-header" style={{ color: config.color }}>
        <Icon size={20} />
        <span>{tileInfo.name || "Comment"}</span>
      </div>
      <div styleName="comment-content">
        <TipTapEditor
          content={tileInfo.data || ""}
          editable={true}
          placeholder="Enter comment content..."
          minHeight="100px"
        />
      </div>
    </div>
  );
}
