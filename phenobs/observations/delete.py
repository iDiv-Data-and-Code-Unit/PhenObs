from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpRequest, JsonResponse

from .models import Collection

@login_required
def delete_collection(request: HttpRequest, id: int) -> JsonResponse:
    """Function to delete a single collection with the given ID. Just to be used for E2E testing.

    Args:
        request: The received request with metadata
        id: The collection ID to be used in deletion process
    
    Returns:
        response: A response object containing message and status of the request

    """
    if request.method == "DELETE":
        print ("DELETE COLLECTION. ID: %s" % id)

        try:
            Collection.objects.get(id=id).delete()
            response = JsonResponse(
                "OK", safe=False
            )
            response.status_code = 200
            return response
        except Collection.DoesNotExist:
            response = JsonResponse(
                "Collection with the id %s does not exist." % id, safe=False
            )
            response.status_code = 404
            return response
        except Exception as e:
            response = JsonResponse(
                e, safe=False
            )
            response.status_code = 500
            return response
    else:
        response = JsonResponse(
            "Method not allowed", safe=False
        )
        response.status_code = 405
        return response
