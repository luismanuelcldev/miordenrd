import { PayPalButtons } from '@paypal/react-paypal-js';
import type { OrderResponseBody } from '@paypal/paypal-js';
import { useToast } from './toastContext';

interface PayPalButtonProps {
  amount: number;
  onSuccess?: (details: OrderResponseBody | undefined) => void;
}

// Renderizo el botón de PayPal y gestiono la creación/captura del pedido con feedback de toast
export function PayPalButton({ amount, onSuccess }: PayPalButtonProps) {
  const { showToast } = useToast();

  return (
    <div className="my-4">
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(_datos, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { value: amount.toString(), currency_code: 'USD' } }],
          });
        }}
        onApprove={async (_data, actions) => {
          const details = await actions.order?.capture();
          showToast('Pago realizado con éxito', 'success');
          if (onSuccess) onSuccess(details);
        }}
        onError={() => {
          showToast('Error en el pago con PayPal', 'error');
        }}
      />
    </div>
  );
}
