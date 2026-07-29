import { Tooltip } from "@mui/material";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

interface Props {
  size?: number;
  tooltip?: boolean;
}

const PremiumBadge: React.FC<Props> = ({ size = 15, tooltip = true }) => {
  const icon = (
    <WorkspacePremiumRoundedIcon
      sx={{
        fontSize: size,
        color: "#f59e0b",
        filter: "drop-shadow(0 0 3px rgba(245,158,11,0.55))",
        flexShrink: 0,
      }}
    />
  );
  if (!tooltip) return icon;
  return (
    <Tooltip title="Premium member" placement="top" arrow>
      {icon}
    </Tooltip>
  );
};

export default PremiumBadge;
