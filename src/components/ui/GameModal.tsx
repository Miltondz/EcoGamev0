import React from 'react';
import { 
    colors, 
    textStyles, 
    panelStyles,
    createStoneButtonStyle,
    handleStoneButtonHover 
} from '../../utils/styles';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    zIndex?: number;
}

interface MessageBoxProps extends BaseModalProps {
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    buttonText?: string;
}

interface ConfirmDialogProps extends BaseModalProps {
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: 'warning' | 'danger' | 'info';
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'warning': return '⚠️';
        case 'error': 
        case 'danger': return '🔥';
        case 'success': return '✅';
        case 'info': 
        default: return '💬';
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'warning': return '#f59e0b';
        case 'error': 
        case 'danger': return '#ef4444';
        case 'success': return '#22c55e';
        case 'info': 
        default: return colors.gold;
    }
};

const ModalOverlay: React.FC<{ isOpen: boolean; onClose: () => void; zIndex: number; children: React.ReactNode }> = ({
    isOpen,
    onClose,
    zIndex,
    children
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: zIndex || 1000,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                style={{
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export const MessageBox: React.FC<MessageBoxProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    buttonText = 'Entendido',
    zIndex = 1000
}) => {
    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose} zIndex={zIndex}>
            <div style={{
                ...panelStyles.primary,
                padding: '32px',
                minWidth: '400px',
                maxWidth: '600px',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                border: `2px solid ${colors.stone.border}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Glassmorphism overlay effects */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none'
                }} />

                {/* Icono del tipo */}
                <div style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.9
                }}>
                    {getTypeIcon(type)}
                </div>

                {/* Título */}
                {title && (
                    <h3 style={{
                        ...textStyles.sectionTitle,
                        fontSize: '24px',
                        marginBottom: '20px',
                        color: getTypeColor(type),
                        textShadow: '0 4px 12px rgba(0,0,0,0.8)'
                    }}>
                        {title}
                    </h3>
                )}

                {/* Mensaje */}
                <p style={{
                    ...textStyles.body,
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    textAlign: 'center',
                    color: colors.muted
                }}>
                    {message}
                </p>

                {/* Botón */}
                <button
                    style={{
                        ...createStoneButtonStyle(),
                        width: '200px',
                        fontSize: '16px',
                        margin: '0 auto'
                    }}
                    onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                    onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                    onClick={onClose}
                    autoFocus
                >
                    {buttonText}
                </button>
            </div>
        </ModalOverlay>
    );
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'warning',
    zIndex = 1000
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleCancel} zIndex={zIndex}>
            <div style={{
                ...panelStyles.primary,
                padding: '32px',
                minWidth: '450px',
                maxWidth: '650px',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                border: `2px solid ${type === 'danger' ? '#ef4444' : colors.stone.border}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Glassmorphism overlay effects */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none'
                }} />

                {/* Icono del tipo */}
                <div style={{
                    fontSize: '56px',
                    marginBottom: '16px',
                    opacity: 0.9
                }}>
                    {getTypeIcon(type)}
                </div>

                {/* Título */}
                {title && (
                    <h3 style={{
                        ...textStyles.sectionTitle,
                        fontSize: '24px',
                        marginBottom: '20px',
                        color: getTypeColor(type),
                        textShadow: '0 4px 12px rgba(0,0,0,0.8)'
                    }}>
                        {title}
                    </h3>
                )}

                {/* Mensaje */}
                <p style={{
                    ...textStyles.body,
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    textAlign: 'center',
                    color: colors.muted
                }}>
                    {message}
                </p>

                {/* Botones */}
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    justifyContent: 'center'
                }}>
                    <button
                        style={{
                            ...createStoneButtonStyle(),
                            width: '140px',
                            fontSize: '16px',
                            color: '#94a3b8' // Color más apagado para cancelar
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.55)';
                            e.currentTarget.style.color = '#cbd5e1';
                            e.currentTarget.style.borderColor = 'rgba(203,213,225,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5), inset 0 -6px 12px rgba(0,0,0,0.55)';
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                        }}
                        onClick={handleCancel}
                    >
                        {cancelText}
                    </button>

                    <button
                        style={{
                            ...createStoneButtonStyle(),
                            width: '140px',
                            fontSize: '16px',
                            color: type === 'danger' ? '#fca5a5' : '#e5b880',
                            borderColor: type === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)'
                        }}
                        onMouseEnter={(e) => {
                            const hoverColor = type === 'danger' ? '#ef4444' : colors.gold;
                            const borderColor = type === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(182,149,82,0.18)';
                            
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.7), inset 0 -6px 12px rgba(0,0,0,0.5)';
                            e.currentTarget.style.color = hoverColor;
                            e.currentTarget.style.borderColor = borderColor;
                        }}
                        onMouseLeave={(e) => {
                            const normalColor = type === 'danger' ? '#fca5a5' : '#e5b880';
                            const borderColor = type === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)';
                            
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.55)';
                            e.currentTarget.style.color = normalColor;
                            e.currentTarget.style.borderColor = borderColor;
                        }}
                        onClick={handleConfirm}
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
};

// Hook personalizado para facilitar el uso
export const useGameModal = () => {
    const [messageBox, setMessageBox] = React.useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        type?: 'info' | 'warning' | 'error' | 'success';
        buttonText?: string;
    }>({
        isOpen: false,
        message: '',
        type: 'info'
    });

    const [confirmDialog, setConfirmDialog] = React.useState<{
        isOpen: boolean;
        title?: string;
        message: string;
        type?: 'warning' | 'danger' | 'info';
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel?: () => void;
    }>({
        isOpen: false,
        message: '',
        type: 'warning',
        onConfirm: () => {}
    });

    const showMessage = (
        message: string, 
        options?: {
            title?: string;
            type?: 'info' | 'warning' | 'error' | 'success';
            buttonText?: string;
        }
    ) => {
        setMessageBox({
            isOpen: true,
            message,
            title: options?.title,
            type: options?.type || 'info',
            buttonText: options?.buttonText
        });
    };

    const showConfirm = (
        message: string,
        onConfirm: () => void,
        options?: {
            title?: string;
            type?: 'warning' | 'danger' | 'info';
            confirmText?: string;
            cancelText?: string;
            onCancel?: () => void;
        }
    ) => {
        setConfirmDialog({
            isOpen: true,
            message,
            onConfirm,
            title: options?.title,
            type: options?.type || 'warning',
            confirmText: options?.confirmText,
            cancelText: options?.cancelText,
            onCancel: options?.onCancel
        });
    };

    const closeMessage = () => {
        setMessageBox(prev => ({ ...prev, isOpen: false }));
    };

    const closeConfirm = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    const MessageBoxComponent = () => (
        <MessageBox
            {...messageBox}
            onClose={closeMessage}
        />
    );

    const ConfirmDialogComponent = () => (
        <ConfirmDialog
            {...confirmDialog}
            onClose={closeConfirm}
        />
    );

    return {
        showMessage,
        showConfirm,
        MessageBoxComponent,
        ConfirmDialogComponent
    };
};
