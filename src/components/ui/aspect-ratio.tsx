
import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

type AspectRatioProps = React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ className, ...props }, ref) => (
  <AspectRatioPrimitive.Root
    ref={ref}
    className={className}
    {...props}
  />
))
AspectRatio.displayName = AspectRatioPrimitive.Root.displayName

export { AspectRatio }
