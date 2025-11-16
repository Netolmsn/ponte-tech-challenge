from rest_framework.pagination import PageNumberPagination


class DefaultPagination(PageNumberPagination):
  page_size = 10
  page_size_query_param = "page_size"
  max_page_size = 50

  def get_page_size(self, request):
    """
    Respeita apenas tamanhos de pagina permitidos (5, 10, 50).
    Caso contrario, usa o padrao (10).
    """
    try:
      size = int(
        request.query_params.get(self.page_size_query_param, self.page_size)
      )
    except (TypeError, ValueError):
      return self.page_size

    return size if size in (5, 10, 50) else self.page_size

