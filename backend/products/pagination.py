from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from collections import OrderedDict


class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 48


    def get_paginated_response(self, data):
        current_page = self.page.number
        total_pages = self.page.paginator.num_pages

        # Calculate visible page numbers (showing 5 pages around current page)
        PAGES_ON_EACH_SIDE = 2
        page_range = list(range(
            max(1, current_page - PAGES_ON_EACH_SIDE),
            min(total_pages + 1, current_page + PAGES_ON_EACH_SIDE + 1)
        ))

        # Add first and last pages if they are not in range
        if page_range[0] > 1:
            if page_range[0] > 2:
                page_range.insert(0, '...')
            page_range.insert(0, 1)

        if page_range[-1] < total_pages:
            if page_range[-1] < total_pages - 1:
                page_range.append('...')
            page_range.append(total_pages)

        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('total_pages', total_pages),
            ('current_page', current_page),
            ('page_size', self.page_size),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('first_page', self.request.build_absolute_uri(
                self.request.path
            )),
            ('last_page', self.request.build_absolute_uri(
                f"{self.request.path}?page={total_pages}"
            )),
            ('available_pages', page_range),
            ('results', data)
        ]))