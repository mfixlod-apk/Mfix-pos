package com.mfix.pos;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

public class QuickPosActivity extends Activity {
    private EditText product, price, qty, customer;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(22, 28, 22, 22);
        root.setGravity(Gravity.TOP);
        root.setBackgroundColor(Color.rgb(245,247,250));
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        TextView title = new TextView(this);
        title.setText("MFIX Quick POS");
        title.setTextSize(28);
        title.setTextColor(Color.rgb(17,26,43));
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 10, 0, 22);
        root.addView(title, new LinearLayout.LayoutParams(-1, -2));

        TextView sub = new TextView(this);
        sub.setText("מכירה מהירה דרך יש חשבונית — בלי API");
        sub.setTextSize(14);
        sub.setTextColor(Color.rgb(107,118,134));
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, 0, 0, 18);
        root.addView(sub, new LinearLayout.LayoutParams(-1, -2));

        product = field("מוצר / ברקוד", false);
        price = field("מחיר", true);
        qty = field("כמות", true);
        qty.setText("1");
        customer = field("שם לקוח (אופציונלי)", false);

        root.addView(product);
        root.addView(price);
        root.addView(qty);
        root.addView(customer);

        Button sell = new Button(this);
        sell.setText("🧾  העבר ליש חשבונית");
        sell.setTextSize(17);
        sell.setOnClickListener(v -> openYesh());
        LinearLayout.LayoutParams sellLp = new LinearLayout.LayoutParams(-1, 58);
        sellLp.setMargins(0, 16, 0, 10);
        root.addView(sell, sellLp);

        Button full = new Button(this);
        full.setText("⚙️  קופה מלאה");
        full.setOnClickListener(v -> {
            Intent i = new Intent(this, YeshInvoiceContractPatchActivity.class);
            startActivity(i);
        });
        root.addView(full, new LinearLayout.LayoutParams(-1, 52));

        setContentView(root);
    }

    private EditText field(String hint, boolean number) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setTextSize(18);
        e.setSingleLine(true);
        e.setPadding(16, 0, 16, 0);
        if (number) e.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, 58);
        lp.setMargins(0, 0, 0, 10);
        e.setLayoutParams(lp);
        return e;
    }

    private void openYesh() {
        String name = product.getText().toString().trim();
        String priceText = price.getText().toString().trim();
        String qtyText = qty.getText().toString().trim();
        if (name.isEmpty()) { product.setError("הזן מוצר או ברקוד"); return; }
        if (priceText.isEmpty()) { price.setError("הזן מחיר"); return; }

        try {
            double p = Double.parseDouble(priceText);
            double q = qtyText.isEmpty() ? 1 : Double.parseDouble(qtyText);
            JSONObject line = new JSONObject();
            line.put("name", name);
            line.put("unitPrice", p);
            line.put("qty", q);

            JSONArray cart = new JSONArray();
            cart.put(line);

            JSONObject payload = new JSONObject();
            payload.put("cart", cart);
            payload.put("customerName", customer.getText().toString().trim());
            payload.put("customerPhone", "");

            Intent i = new Intent(this, YeshInvoiceWebActivity.class);
            i.putExtra("mfix_sale_payload", payload.toString());
            startActivity(i);
        } catch (Exception e) {
            price.setError("מחיר לא תקין");
        }
    }
}
