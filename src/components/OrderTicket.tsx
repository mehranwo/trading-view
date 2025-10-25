'use client';

import { memo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBalanceStore } from '@/state/useBalanceStore';
import { useBookStore } from '@/state/useBookStore';
import { validateOrder, calculateCost, estimatePnL } from '@/lib/risk';
import { formatCurrency, formatPrice } from '@/lib/format';
import { Number } from './Number';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const orderFormSchema = z.object({
  quantity: z.string()
    .min(1, 'Quantity is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Quantity must be a positive number'),
});

export const OrderTicket = memo(function OrderTicket() {
  const { USD, BTC, update: updateBalance } = useBalanceStore();
  const { getBestBid, getBestAsk } = useBookStore();

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      quantity: '',
    },
  });

  const bestBid = getBestBid();
  const bestAsk = getBestAsk();
  const estimatedPrice = side === 'buy' ? bestAsk : bestBid;

  const quantity = form.watch('quantity');
  const qty = parseFloat(quantity) || 0;
  const cost = estimatedPrice ? calculateCost(qty, estimatedPrice) : 0;

  const pnlUp = estimatedPrice ? estimatePnL(side, qty, estimatedPrice, 0.5) : 0;
  const pnlDown = estimatedPrice ? estimatePnL(side, qty, estimatedPrice, -0.5) : 0;

  const onSubmit = (values: z.infer<typeof orderFormSchema>) => {
    if (!estimatedPrice) {
      form.setError('quantity', { message: 'Price not available' });
      return;
    }

    const qty = parseFloat(values.quantity);
    const validation = validateOrder(side, qty, estimatedPrice, { USD, BTC });

    if (!validation.valid) {
      form.setError('quantity', { message: validation.error || 'Invalid order' });
      return;
    }

    const orderCost = calculateCost(qty, estimatedPrice);

    if (side === 'buy') {
      updateBalance({
        USD: USD - orderCost,
        BTC: BTC + qty,
      });
      setToastMessage(`Bought ${qty.toFixed(8)} BTC for ${formatCurrency(orderCost)}`);
    } else {
      updateBalance({
        USD: USD + orderCost,
        BTC: BTC - qty,
      });
      setToastMessage(`Sold ${qty.toFixed(8)} BTC for ${formatCurrency(orderCost)}`);
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    form.reset();
  };

  return (
    <Card className="flex flex-col h-full border-0 rounded-none">
      <CardHeader className="bg-linear-to-r from-transparent via-blue-500/10 to-transparent">
        <CardTitle className="flex items-center gap-2">
          Order Ticket
        </CardTitle>
        <CardDescription>Place buy or sell orders</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-linear-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-semibold uppercase">USD Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl text-green-500">
                <Number value={formatCurrency(USD)} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-linear-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-semibold uppercase">BTC Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl text-orange-500">
                <Number value={BTC.toFixed(8)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold">Order Side</label>
          <Tabs value={side} onValueChange={(value) => setSide(value as 'buy' | 'sell')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (BTC)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.00000001"
                        min="0"
                        placeholder="0.00000000"
                        className="font-mono text-lg pr-8"
                        {...field}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                        BTC
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {estimatedPrice && qty > 0 && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated Price:</span>
                    <Badge variant="outline" className="font-mono">
                      <Number
                        value={formatPrice(estimatedPrice, 2)}
                        color={side === 'buy' ? 'red' : 'green'}
                      />
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total {side === 'buy' ? 'Cost' : 'Proceeds'}:</span>
                    <span className="font-mono font-bold text-lg">
                      <Number value={formatCurrency(cost)} />
                    </span>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Estimated PnL at ±0.5%</p>
                    <div className="space-y-2">
                      <Card className="bg-green-500/5">
                        <CardContent className="flex justify-between items-center py-3">
                          <span className="text-sm font-semibold">+0.5%</span>
                          <span className="font-mono font-bold">
                            <Number
                              value={formatCurrency(pnlUp)}
                              color={pnlUp >= 0 ? 'green' : 'red'}
                            />
                          </span>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-500/5">
                        <CardContent className="flex justify-between items-center py-3">
                          <span className="text-sm font-semibold">-0.5%</span>
                          <span className="font-mono font-bold">
                            <Number
                              value={formatCurrency(pnlDown)}
                              color={pnlDown >= 0 ? 'green' : 'red'}
                            />
                          </span>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              disabled={!estimatedPrice || qty <= 0}
              className={`w-full h-12 text-lg font-bold ${
                side === 'buy'
                  ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              Place {side === 'buy' ? 'Buy' : 'Sell'} Order
            </Button>
          </form>
        </Form>

      </CardContent>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-linear-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-toast border-2 border-green-400 z-50">
          <div className="flex items-center gap-3">
            <span className="font-bold">{toastMessage}</span>
          </div>
        </div>
      )}
    </Card>
  );
});

