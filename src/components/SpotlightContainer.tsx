
import { useRef, useEffect } from 'react';

interface SpotlightContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    spotlightColor?: string;
    variant?: 'soft' | 'thunder';
    children: React.ReactNode;
}

export default function SpotlightContainer({
    children,
    className = '',
    spotlightColor = '#FA003C', // Onlook Red/Pink
    variant = 'thunder', // Default to the main effect
    style,
    ...props
}: SpotlightContainerProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);

    // Physics state
    const mousePos = useRef({ x: 0, y: 0 });
    const spotlightPos = useRef({ x: 0, y: 0 });
    const frameId = useRef<number>(0);
    const lastMoveTime = useRef<number>(0);
    // hueRef removed - using fixed Onlook color

    // We use a ref for opacity to update it in the loop without re-renders
    const opacityRef = useRef(0);

    useEffect(() => {
        // Animation loop
        const animate = () => {
            if (!divRef.current || !spotlightRef.current) {
                frameId.current = requestAnimationFrame(animate);
                return;
            }

            const now = Date.now();
            const timeSinceMove = now - lastMoveTime.current;

            // 0. Idle Detection: Fade out if idle for > 2000ms
            const targetOpacity = timeSinceMove > 2000 ? 0 : 0.15; // Max opacity 0.15 for subtle effect
            // Smoothly lerp opacity
            opacityRef.current += (targetOpacity - opacityRef.current) * 0.1;

            // Optimization: If completely invisible and target is 0, skip physics to save resources
            // But we keep running to catch the "wake up" event or if it's still fading out
            if (opacityRef.current < 0.001 && targetOpacity === 0) {
                spotlightRef.current.style.opacity = '0';
                frameId.current = requestAnimationFrame(animate);
                return;
            }

            spotlightRef.current.style.opacity = opacityRef.current.toFixed(3);

            // 1. Calculate distance (Target - Current)
            const distX = mousePos.current.x - spotlightPos.current.x;
            const distY = mousePos.current.y - spotlightPos.current.y;

            // 2. Move Light (Lerp) - "The Lag"
            // Increased lag slightly for smoother feel
            spotlightPos.current.x += distX * 0.08;
            spotlightPos.current.y += distY * 0.08;

            // 3. Apply Styles
            // Clean circle/glow, no complex rotation or distortion for now to match cleaner look
            spotlightRef.current.style.transform = `
                translate3d(${spotlightPos.current.x - 200}px, ${spotlightPos.current.y - 200}px, 0)
            `;

            if (variant === 'thunder') {
                spotlightRef.current.style.background = spotlightColor;
                // Double layer shadow for "glow"
                spotlightRef.current.style.boxShadow = `
                    0 0 100px 40px ${spotlightColor},
                    0 0 40px 10px ${spotlightColor}
                `;
            }

            frameId.current = requestAnimationFrame(animate);
        };

        frameId.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId.current);
    }, [variant, spotlightColor]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        mousePos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        lastMoveTime.current = Date.now();
        // Don't set state here to avoid re-renders. Opacity is handled in loop.
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (divRef.current) {
            const rect = divRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            mousePos.current = { x, y };
            spotlightPos.current = { x, y };
            lastMoveTime.current = Date.now();
            opacityRef.current = 0.15; // Instant on
        }
    };

    const handleMouseLeave = () => {
        // Force fade out by setting time to old
        lastMoveTime.current = 0;
    };

    // Static background style for 'soft' variant since it doesn't change color dynamically in the loop
    const softBackground = `radial-gradient(400px circle at center, ${spotlightColor}, transparent 40%)`;

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{
                position: 'relative',
                overflow: 'hidden',
                ...style,
            }}
            {...props}
        >
            {/*
                Thunder Variant: Onlook Style (Premium Blur, Specific Color)
                Soft Variant: Standard Radial Gradient (but still lags/fades)
             */}
            <div
                ref={spotlightRef}
                style={{
                    pointerEvents: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '400px',
                    height: '400px',
                    opacity: 0, // Starts invisible
                    background: variant === 'thunder' ? undefined : softBackground, // 'thunder' uses CSS bg + shadow
                    zIndex: 0,
                    borderRadius: '50%',
                    filter: variant === 'thunder' ? 'blur(80px)' : 'none', // Increased blur
                    mixBlendMode: variant === 'thunder' ? 'screen' : 'normal',
                    willChange: 'transform, opacity',
                }}
            />
            <div style={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: style?.display === 'flex' ? 'flex' : 'block',
                flexDirection: (style?.flexDirection as any) || 'column',
                alignItems: (style?.alignItems as any) || 'stretch',
                justifyContent: (style?.justifyContent as any) || 'center',
            }}>
                {children}
            </div>
        </div>
    );
}
