class PDFDataFormatter:
    @staticmethod
    def format_sales_data(data):
        """ Format sales data for PDF """
        return [{
            'Order ID': item['Order ID'],
            'Date': item['Date'],
            'Customer': item['Customer'],
            'Amount': f"${item['Amount']:.2f}",
            'Status': item['Status'].title(),
            'Items': item['Items']
        } for item in data]

    @staticmethod
    def format_products_data(data):
        """Format products data for PDF"""
        return [{
            'ID': item['Product ID'],
            'Product': item['Name'],
            'Category': item['Category'],
            'Price': f"${item['Price']:.2f}",
            'Stock': item['Stock'],
            'Total Sold': item['Total Sold'],
            'Revenue': f"${item['Revenue']:.2f}"
        } for item in data]

    @staticmethod
    def format_orders_data(data):
        """Format orders data for PDF"""
        return [{
            'Order ID': item['Order ID'],
            'Date': item['Date'],
            'Customer': item['Customer Email'],
            'Amount': f"${item['Total Amount']:.2f}",
            'Status': item['Status'].title(),
            'Payment': item['Payment Status']
        } for item in data]

    @staticmethod
    def format_customers_data(data):
        """Format customers data for PDF"""
        return [{
            'ID': item['Customer ID'],
            'Name': item['Name'],
            'Email': item['Email'],
            'Joined': item['Joined Date'],
            'Orders': item['Total Orders'],
            'Total Spent': f"${item['Total Spent']:.2f}",
            'Avg Order': f"${item['Average Order Value']:.2f}"
        } for item in data]
