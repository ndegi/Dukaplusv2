"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/lib/contexts/currency-context";

interface SellingPrice {
  unit_of_measure: string;
  unit_selling_price: number;
}

interface CartItemEditorProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  sellingPrices: SellingPrice[];
  onUpdate: (quantity: number, price: number, unit: string) => void;
}

export function CartItemEditor({
  isOpen,
  onClose,
  item,
  sellingPrices,
  onUpdate,
}: CartItemEditorProps) {
  const { currency } = useCurrency();

  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [price, setPrice] = useState(item?.price || 0);
  const [selectedUnit, setSelectedUnit] = useState(
    item?.unit_of_measure || sellingPrices[0]?.unit_of_measure
  );

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    const selectedPrice = sellingPrices.find((p) => p.unit_of_measure === unit);
    if (selectedPrice) {
      setPrice(selectedPrice.unit_selling_price);
    }
  };

  const handleSave = () => {
    onUpdate(quantity, price, selectedUnit);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-content">
        <DialogHeader>
          <DialogTitle className="dialog-title">
            Edit Item: {item?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="form-label">Unit of Measure</Label>
            <Select value={selectedUnit} onValueChange={handleUnitChange}>
              <SelectTrigger className="select-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dialog-content">
                {sellingPrices.map((sp) => (
                  <SelectItem
                    key={sp.unit_of_measure}
                    value={sp.unit_of_measure}
                  >
                    {sp.unit_of_measure} - {currency}{" "}
                    {sp.unit_selling_price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="form-label">Quantity</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0.01)}
              className="input-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="form-label">Unit Price ({currency})</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className="input-base"
            />
          </div>

          <div className="card-base p-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal:</span>
              <span className="text-warning font-semibold">
                {currency} {(quantity * price).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="btn-create flex-1">
              Save Changes
            </Button>
            <Button onClick={onClose} className="btn-cancel flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
